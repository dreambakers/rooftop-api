const formidable = require('formidable');
const fs = require('fs');

/*
  Finds a file against the provided key in the body
  If there's a valid file found, then its base64 
  string is appended in the req body
*/
module.exports = function (key, fileTypes) {
  return function(req, res, next) {
    const form = formidable({ multiples: true });
    form.parse(req, (err, fields, files) => {
      if (err) {
        next(err);
        return;
      }
      req.body = fields;
      if (files[key]) {
        if (fileTypes.includes(files[key].type)) {
          req.body[key] = `data:${files[key].type};base64,${fs.readFileSync(files[key].path).toString('base64')}`;
        }
      }
      next();
    });
  }
};