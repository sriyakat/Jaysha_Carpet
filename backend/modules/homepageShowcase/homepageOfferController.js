const createHomepageMediaController = require("./homepageMediaControllerFactory");
const storage = require("./homepageOfferStorage");

module.exports = createHomepageMediaController(storage, "homepage-offers");
