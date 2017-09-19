var OncoprintJS = require('./oncoprint.js');

if (typeof window !== "undefined") {
  window.Oncoprint = OncoprintJS;
}

module.exports = OncoprintJS;
