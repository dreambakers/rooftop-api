const formidable = require('formidable');
const fs = require('fs');

/*
  Finds an file against the provided key in the body
  If there's a valid file found, then its base64 
  string is appended in the req body
*/
module.exports = function (key) {
  return function(req, res, next) {
    const form = formidable({ multiples: true });
    form.parse(req, (err, fields, files) => {
      if (err) {
        next(err);
        return;
      }
      req.body = fields;
      if (files[key]) {
        const file = fs.readFileSync(files[key].path).toString("base64");
        req.body[key] = file;
      }
      next();
    });
  }
};