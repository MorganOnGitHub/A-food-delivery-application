const searchService = {
    validateSortCriteria: (sortBy, sortOrder) => {
        const validFields = ['name', 'email', 'createdAt', 'date_of_birth'];
        const validOrders = ['asc', 'desc'];
        
        if (!sortBy || !validFields.includes(sortBy)) {
            throw new Error(`Invalid sort field. Must be one of: ${validFields.join(', ')}`);
        }
        
        if (!sortOrder || !validOrders.includes(sortOrder.toLowerCase())) {
            throw new Error('Invalid sort order. Must be either "asc" or "desc"');
        }

        // Check for null or empty sort field
        if (sortBy.trim().length === 0) {
            throw new Error('Sort field cannot be empty');
        }
    },

    processSearchResults: (results, sortBy, sortOrder) => {
        if (!Array.isArray(results)) {
            throw new Error('Invalid results format');
        }

        // Remove results with null or empty sort fields
        const validResults = results.filter(result => {
            const value = result[sortBy];
            return value !== null && 
                   value !== undefined && 
                   (typeof value !== 'string' || value.trim() !== '');
        });

        // Handle different data types consistently
        const sortedResults = validResults.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];

            // Convert to comparable format based on data type
            if (aVal instanceof Date && bVal instanceof Date) {
                // Date comparison
                aVal = aVal.getTime();
                bVal = bVal.getTime();
            } else if (typeof aVal === 'string' && typeof bVal === 'string') {
                // String comparison (case-insensitive)
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            } else {
                // Convert to strings for consistent comparison
                aVal = String(aVal).toLowerCase();
                bVal = String(bVal).toLowerCase();
            }

            // Perform the comparison
            if (sortOrder === 'asc') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            } else {
                return bVal < aVal ? -1 : bVal > aVal ? 1 : 0;
            }
        });

        // Handle duplicates by creating a Map with email as key
        const uniqueResults = Array.from(
            new Map(sortedResults.map(item => [item.email, item])).values()
        );

        // Maintain sort order after removing duplicates
        return uniqueResults;
    },

    validateSearchQuery: (query) => {
        if (!query || typeof query !== 'string') {
            throw new Error('Search query must be a non-empty string');
        }

        if (query.trim().length === 0) {
            throw new Error('Search query cannot be empty');
        }

        // Check for unsupported data types in the query
        const unsupportedPatterns = [
            /^\d+$/, // numbers only
            /^[{}[\]]+$/, // JSON-like structures
            /^<.*>$/ // HTML-like tags
        ];

        for (const pattern of unsupportedPatterns) {
            if (pattern.test(query)) {
                throw new Error('Search query contains unsupported data format');
            }
        }

        return query.trim();
    },

    formatSearchResults: (results) => {
        if (!Array.isArray(results)) {
            throw new Error('Invalid results format');
        }

        return results.map(result => ({
            name: result.name || '',
            email: result.email || '',
            phone_number: result.phone_number || '',
            date_of_birth: result.date_of_birth || null,
            // Add any additional fields needed for display
        })).filter(result => result.name || result.email); // Ensure at least one required field exists
    }
};

module.exports = searchService;