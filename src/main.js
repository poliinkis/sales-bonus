/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   let { discount, sale_price, quantity } = purchase;
   discount = 1 - (purchase.discount / 100);
   return sale_price * quantity * discount;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;
    if (index === 0) {
        return profit * 0.15;
    } else if (index === 1 || index === 2) {
        return profit * 0.10;
    } else if (index === total - 1) {
        return 0;
    } else {
        return profit * 0.05;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data
        || !Array.isArray(data.sellers) || data.sellers.length === 0
        || !Array.isArray(data.products) || data.products.length === 0
        || !Array.isArray(data.purchase_records) || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    // @TODO: Проверка наличия опций
    const { calculateRevenue, calculateBonus } = options;
    if (!calculateRevenue || !calculateBonus) {
         throw new Error('Чего-то не хватает');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        profit: 0,
        sales_count: 0,
        bonus: 0,
        revenue: 0,
        top_products: [],
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(sellerStats.map(item => [item.seller_id, item]));
    const productIndex = Object.fromEntries(data.products.map(item => [item.sku, item]));

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => { // Чек 
        const seller = sellerIndex[record.seller_id]; // Продавец
        // Увеличить количество продаж
        seller.sales_count = seller.sales_count + 1;
        // Увеличить общую сумму выручки всех продаж
        seller.revenue = seller.revenue + record.total_amount; 

        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            const cost = product.purchase_price * item.quantity;
            // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            const itemRevenue = calculateRevenue(item, product);
            // Посчитать прибыль: выручка минус себестоимость
            const itemProfit = itemRevenue - cost;
            // Увеличить общую накопленную прибыль (profit) у продавца
            seller.profit = seller.profit + itemProfit;

            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            // Увеличить число всех проданных товаров у продавца на количество проданных товаров в конкретном чеке
            seller.products_sold[item.sku] = seller.products_sold[item.sku] + item.quantity;
        });
 });

    // @TODO: Сортировка продавцов по прибыли
    // Сортируем продавцов по прибыли
   sellerStats.sort(function(a, b) {
    return b.profit - a.profit;
   });

    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller)// Считаем бонус
        seller.top_products = Object.entries(seller.products_sold)
        .map(function(entry) {
            return {
                sku: entry[0],
                quantity: entry[1]
            };
        })
        .sort(function(a, b) {
            return b.quantity - a.quantity;
        }) 
        .slice(0,10);// Формируем топ-10 товаров
});

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.seller_id, // Строка, идентификатор продавца
        name: seller.name, // Строка, имя продавца
        revenue: +seller.revenue.toFixed(2), // Число с двумя знаками после точки, выручка продавца
        profit: +seller.profit.toFixed(2), // Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count, // Целое число, количество продаж продавца
        top_products: seller.top_products, // Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: +seller.bonus.toFixed(2) // Число с двумя знаками после точки, бонус продавца
}));
}
