const repository = require("../sqlContent/contentRepository");

async function setProductIds(productIds) {
    const uniqueIds = new Set(productIds);
    if (uniqueIds.size !== productIds.length) {
        const error = new Error("A product can only be selected once.");
        error.statusCode = 400;
        throw error;
    }
    return repository.setNewArrivalProductIds(productIds);
}

module.exports = {
    getProductIds: repository.getNewArrivalProductIds,
    setProductIds
};
