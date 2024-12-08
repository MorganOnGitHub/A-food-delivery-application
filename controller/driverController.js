const Driver = require('../models/Driver');

const driverController = {
    async searchDrivers(req, res) {
        try {
            const { searchTerm, sort = 'asc' } = req.query;
            let query = {};
            
            if (searchTerm) {
                query = {
                    $or: [
                        { name: { $regex: searchTerm, $options: 'i' } },
                        { phone_number: { $regex: searchTerm, $options: 'i' } }
                    ]
                };
            }
            
            const drivers = await Driver.find(query)
                .sort({ name: sort })
                .populate('current_orders');
                
            res.render('drivers', { drivers });
        } catch (error) {
            res.status(500).render('error', { message: 'Error searching drivers' });
        }
    }
};

module.exports = driverController; 