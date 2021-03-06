const fs = require('fs');

const lexer = require('./lexer.js')
const parser = require('./parser.js')
const gen = require('./generator.js')
const consoletheme = require("./consoletheme.js")

var preOptions
const compile = function(path){

  let num = 1;
  if(fs.lstatSync(path).isFile()){

    readFile(path);
    console.log(consoletheme.FgGreen,"Read " + num + " Files and compiled successfully",consoletheme.Reset);

  } else {

    if(fs.existsSync(path + "/mcscript")) gen.getFiles(path + "/mcscript","mcfunction").forEach((item) => {
      fs.unlink(item, () => false);
    });

   preOptions = {
      vars: [],
      modals: [],
      tags: [],
      consts: []
    }
    let files = gen.getFiles(path)
    let globals = files.filter(x => {
      if(x.split(".").slice(-2).join(".") == 'gl.mcscript'){
        files.splice(files.indexOf(x),1)
        return true
      }
      return false
    })
    for(let file of globals){
      readFile(file,{noParse: 'vars'});
    }
    for(let file of files){
      num++;
      readFile(file);
    }

    console.log(consoletheme.FgGreen,"Read " + num + " Files and compiled successfully",consoletheme.Reset);
  }
}

function changeOptions(opt){
  preOptions.vars = preOptions.vars.concat(opt.vars.filter(x => preOptions.vars.indexOf(x) == -1))

  preOptions.modals = preOptions.modals.concat(opt.modals.filter(x => preOptions.modals.indexOf(x) == -1))

  preOptions.tags = preOptions.tags.concat(opt.tags.filter(x => preOptions.tags.indexOf(x) == -1))

  preOptions.consts = preOptions.consts.concat(opt.consts.filter(x => preOptions.consts.indexOf(x) == -1))
}

const genModals = function(path){

  if(fs.lstatSync(path).isFile()){

    readFile(path, {noParse: "modal"});
    console.log(consoletheme.FgGreen,"Read " + path + " and compiled to JSON",consoletheme.Reset);

  } else {
    throw "Just one File accepted!";
  }
}

const genAst = function(path){

  if(fs.lstatSync(path).isFile()){

    readFile(path, {noParse: "json"});
    console.log(consoletheme.FgGreen,"Read " + path + " and compiled to JSON",consoletheme.Reset);

  } else {
    throw "Just one File accepted!";
  }
}

const watch = function(path){

  console.log(consoletheme.FgGreen,"Now I watch your files on "+path+" to change! *-*",consoletheme.Reset)

  let counter = false;

  fs.watch(path, { recursive: true }, (eventType, filename) => {

    filename = filename.replace(/\\/g, "/");

    if (filename && filename.split('.').pop() == 'mcscript' && counter) {


      try {
        compile(path)
      } catch(err){
        console.log(consoletheme.FgCyan,err,consoletheme.Reset);
      }

    }
    counter = !counter;
  });
}

function readFile(file, options = {}){

  fs.readFile(file, {encoding: "utf8"}, function(err, data) {

    data = data.split("\n");
    for(let item of data) {

      if(item.trim() == "{"){
        data[data.indexOf(item) - 1] = data[data.indexOf(item) - 1].substr(0, data[data.indexOf(item) - 1].length -2)
      }

      if(",;({[".indexOf(item.trim().slice(-1)) == -1){
        data[data.indexOf(item)] += ";"
      }

    }
    data= data.join("\n");
    if(options.noParse == "modal") gen.getModals(parser.parse(lexer.lexer(data)),file);
    else if(options.noParse == "json") gen.getAst(parser.parse(lexer.lexer(data)),file)
    else if(options.noParse == "vars")  changeOptions(gen.getVars(parser.parse(lexer.lexer(data)),file, preOptions))
    else gen.parseCode(parser.parse(lexer.lexer(data, file)),file, preOptions)
  });
}
exports.compile = compile;
exports.watch = watch;
exports.genModals = genModals;
