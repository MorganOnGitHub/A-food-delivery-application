const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');

const deliveryService = {
    async estimateDeliveryTime(orderId) {
        const order = await Order.findById(orderId)
            .populate('restaurant')
            .populate('delivery_address');
            
        // Calculate base preparation time
        const prepTime = 15; // minutes
        
        // Calculate distance-based time
        const distanceTime = await this.calculateDistanceTime(
            order.restaurant.location,
            order.delivery_address
        );
        
        // Add traffic factor
        const trafficMultiplier = this.getTrafficMultiplier();
        
        const totalMinutes = (prepTime + distanceTime) * trafficMultiplier;
        
        const estimatedTime = new Date();
        estimatedTime.setMinutes(estimatedTime.getMinutes() + totalMinutes);
        
        return estimatedTime;
    },
    
    getTrafficMultiplier() {
        const hour = new Date().getHours();
        // Peak hours: 8-10 AM and 5-7 PM
        if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) {
            return 1.5;
        }
        return 1.0;
    }
};

module.exports = deliveryService;
