module.exports = {
  roots: ["./src/test/"],
  moduleDirectories: [
    ".", "src", "src/test", "node_modules"
  ],
  transform: {
    "^.+\\.ts$": "ts-jest",
  } ,
  moduleNameMapper: {
    "\\.(css|jpg|png|svg)$": "mocks/empty-module.js"
  }      
};
