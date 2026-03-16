/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const { discount, sale_price, quantity } = purchase;
    const discountAmount = 1 - (discount / 100);
    return sale_price * quantity * discountAmount;

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
    if (!data || !Array.isArray(data.sellers) || !Array.isArray(data.products) || !Array.isArray(data.purchase_records)) {
        throw new Error('Некорректные входные данные');
    }

    if (data.sellers.length === 0 || data.products.length === 0 || data.purchase_records.length === 0) {
        throw new Error('Входные данные не должны быть пустыми');
    }

    const { calculateRevenue, calculateBonus } = options || {};

    if (options) { 
        if (calculateRevenue && typeof calculateRevenue !== 'function') {
        throw new Error('Опция calculateRevenue должна быть функцией');
        }

        if (calculateBonus && typeof calculateBonus !== 'function') {
        throw new Error('Опция calculateBonus должна быть функцией');
        }
    }

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
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return; // Игнорируем записи с несуществующими продавцами

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return; // Игнорируем записи с несуществующими товарами

            const revenue = calculateRevenue ? calculateRevenue(item, product) : calculateSimpleRevenue(item, product);
            const profit = revenue - (product.purchase_price * item.quantity);

            seller.sales_count += 1;
            seller.revenue += revenue;
            seller.profit += profit;

            // Учет количества проданных единиц каждого товара для определения топ-продуктов
            if (!seller.product_sold[item.sku]) {
                seller.product_sold[item.sku] = 0;
            }
            seller.product_sold[item.sku] += item.quantity;
        });
    });

    //Сортировка продавцов по прибыли
    const sortedSellers = sellerStatistics.sort((a, b) => b.profit - a.profit);
    const totalSellers = sortedSellers.length;

    //Формируем итоговый отчет
    return sortedSellers.map((seller, index) => {
        //Определяем топ-3 продаваемых товара для каждого продавца
        const topProducts = Object.entries(seller.product_sold)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([sku, quantity]) => ({sku, quantity}));

        const bonus = calculateBonus ? calculateBonus(index, totalSellers, seller) : calculateBonusByProfit(index, totalSellers, seller);

        return {
            seller_id: seller.id,
            name: seller.name,
            sales_count: seller.sales_count,
            revenue: parseFloat(seller.revenue.toFixed(2)),
            profit: parseFloat(seller.profit.toFixed(2)),
            bonus: parseFloat(bonus.toFixed(2)),
            top_products: topProducts
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



if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        analyzeSalesData,
        calculateSimpleRevenue,
        calculateBonusByProfit
    };
}