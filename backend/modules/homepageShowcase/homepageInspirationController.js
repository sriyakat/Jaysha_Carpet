const createHomepageMediaController = require("./homepageMediaControllerFactory");
const storage = require("./homepageInspirationStorage");

module.exports = createHomepageMediaController(storage);
