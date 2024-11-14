const textDisplayValidator = {
    validateTextLength: (maxLength = 1000) => (req, res, next) => {
        const textFields = ['name', 'email', 'profile'];
        let error = null;
        
        for (const field of textFields) {
            if (req.body[field] || req.query[field]) {
                const fieldValue = req.body[field] || req.query[field];
                if (fieldValue.length > maxLength) {
                    error = {
                        field,
                        message: `${field} exceeds maximum length of ${maxLength} characters`
                    };
                    break;
                }
            }
        }

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
                field: error.field
            });
        }
        next();
    },

    validateRequiredFields: () => (req, res, next) => {
        const requiredFields = ['name', 'email'];
        const missingFields = requiredFields.filter(field => {
            const value = req.body[field] || req.query[field];
            return !value || value.trim().length === 0;
        });
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing or empty required fields: ${missingFields.join(', ')}`,
                fields: missingFields
            });
        }
        next();
    },

    validateSpecialCharacters: () => (req, res, next) => {
        const textFields = ['name', 'email', 'profile'];
        const specialCharRegex = /^[a-zA-Z0-9\s@._-]+$/;
        let error = null;
        
        for (const field of textFields) {
            if (req.body[field] || req.query[field]) {
                const fieldValue = req.body[field] || req.query[field];
                if (!specialCharRegex.test(fieldValue)) {
                    error = {
                        field,
                        message: `${field} contains unsupported characters. Only letters, numbers, spaces, and basic punctuation (@._-) are allowed.`
                    };
                    break;
                }
            }
        }

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
                field: error.field
            });
        }
        next();
    },

    validatePermissions: () => (req, res, next) => {
        // Check if user exists and has required permissions
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required to access this data'
            });
        }

        // Check if user has the required permission
        if (!req.user.permissions || !req.user.permissions.includes('view_protected_data')) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions to access this data',
                requiredPermission: 'view_protected_data'
            });
        }
        next();
    },

    // New validator for checking if text information exceeds system limits
    validateSystemLimits: () => (req, res, next) => {
        const limits = {
            maxTotalLength: 5000, // Maximum combined length of all text fields
            maxFieldCount: 20,    // Maximum number of text fields allowed
        };

        // Calculate total length of all text fields
        const totalLength = Object.values(req.body)
            .concat(Object.values(req.query))
            .filter(val => typeof val === 'string')
            .reduce((sum, val) => sum + val.length, 0);

        if (totalLength > limits.maxTotalLength) {
            return res.status(400).json({
                success: false,
                message: `Total text length exceeds system limit of ${limits.maxTotalLength} characters`,
                currentLength: totalLength
            });
        }

        // Check number of fields
        const fieldCount = Object.keys(req.body)
            .concat(Object.keys(req.query))
            .filter(key => typeof req.body[key] === 'string' || typeof req.query[key] === 'string')
            .length;

        if (fieldCount > limits.maxFieldCount) {
            return res.status(400).json({
                success: false,
                message: `Number of text fields exceeds system limit of ${limits.maxFieldCount}`,
                currentCount: fieldCount
            });
        }

        next();
    }
};

module.exports = textDisplayValidator;