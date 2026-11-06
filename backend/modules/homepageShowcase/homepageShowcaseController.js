const createHomepageMediaController = require("./homepageMediaControllerFactory");
const storage = require("./homepageShowcaseStorage");

module.exports = createHomepageMediaController(storage);
