/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const { discount, sale_price, quantity } = purchase;
    const discountAmount = 1 - discount / 100;
    const revenue = sale_price * quantity * discountAmount;

    function roundMoney(value) {
        return Math.round(value * 100) / 100;
        
    }
    return roundMoney(revenue);
}
   // @TODO: Расчет выручки от операции

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;

    if (index === 0) return profit * 0.15; // Бонус для первого места 15%


    if (index === 1 || index === 2) return profit * 0.10; 
    // Бонус для топ-10%

    if (index === 3) return profit * 0.05; // Бонус для 3-го места

    return 0; // Бонус для остальных продавцов
    // @TODO: Расчет бонуса от позиции в рейтинге
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    //Проверка входных данных
    if (!data) {
        throw new Error("Отсутствуют данные для анализа");
    }

    if (!Array.isArray(data.sellers)) {
        throw new Error("Неверный формат данных: sellers должен быть массивом");
    }

    if (!Array.isArray(data.products)) {
        throw new Error("Неверный формат данных: products должен быть массивом");
    }

    if (!Array.isArray(data.purchase_records)) {
        throw new Error("Неверный формат данных: purchase_records должен быть массивом");
    }

    if (data.sellers.length === 0 || data.products.length === 0 || data.purchase_records.length === 0) {
        throw new Error("Входные данные не должны быть пустыми");
    }

    if (!options || typeof options.calculateRevenue !== 'function' || typeof options.calculateBonus !== 'function') {
        throw new Error("Некорректные опции для анализа данных");
    }

    const { calculateRevenue, calculateBonus } = options;

    //Создание промежуточной структуры для сбора статистики по каждому продавцу
    const sellerStatistics = data.sellers.map(seller => ({
            id: seller.id,
            name: `${seller.first_name} ${seller.last_name}`,
            sales_count: 0,
            revenue: 0,
            profit: 0,
            product_sold: {}
    }));
    
    //Быстрый доступ к данным о товарах по их sku
    const productIndex = data.products.reduce((acc, product) => {
        acc[product.sku] = product;
        return acc;
    }, {});
    
    //Быстрый доступ к данным о продавцах по их ID
    const sellerIndex = sellerStatistics.reduce((acc, seller) => {
        acc[seller.id] = seller;
        return acc;
    }, {});

    //Обработка каждой покупки для накопления статистики по каждому продавцу

    data.purchase_records.forEach((record) => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return; // Игнорируем записи с несуществующими продавцами

        seller.sales_count += 1;

        record.items.forEach((item) => {

            const product = productIndex[item.sku];
            if (!product) return; // Игнорируем записи с несуществующими товарами

            const revenue = calculateRevenue(item, product);
            const profit = revenue - product.purchase_price * item.quantity;

            seller.revenue += revenue;
            seller.profit += profit;

            // Учет количества проданных единиц каждого товара для определения топ-продуктов
            if (!seller.product_sold[item.sku]) {
                seller.product_sold[item.sku] = 0;
            }

            // Увеличиваем количество проданных единиц для данного товара
            seller.product_sold[item.sku] += item.quantity;
        });
    });

    //Сортировка продавцов по прибыли
    sellerStatistics.sort((a, b) => b.profit - a.profit);

    return sellerStatistics.map((seller, index) => {
        //Назначение бонусов на основе ранжирования
        const bonus = calculateBonus(index, sellerStatistics.length, seller);

            //Определение топ-10 продуктов по количеству проданных единиц
        const top_products = Object.entries(seller.product_sold)
                .map(([sku, quantity]) => ({ sku, quantity }))
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 10);

        return {
            seller_id: seller.id,
            name: seller.name,
            sales_count: seller.sales_count,
            revenue: +seller.revenue.toFixed(2),
            profit: +seller.profit.toFixed(2),
            bonus: +bonus.toFixed(2),
            top_products: top_products
        };
    }); 

    // @TODO: Проверка входных данных

    // @TODO: Проверка наличия опций

    // @TODO: Подготовка промежуточных данных для сбора статистики

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    // @TODO: Расчет выручки и прибыли для каждого продавца

    // @TODO: Сортировка продавцов по прибыли

    // @TODO: Назначение премий на основе ранжирования

    // @TODO: Подготовка итоговой коллекции с нужными полями
}