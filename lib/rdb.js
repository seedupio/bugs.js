// Requires
var _ = require('lodash');

var os = require('os');
var inherits = require('util').inherits;

var pty = require('pty.js');


function parseLocation(line) {
    var parts = line.split(':', 3);
    var lineno = parseInt(parts[1], 10);

    // Ensure validity
    if(
        parts.length < 3 ||
        isNaN(lineno)
    ) return null;

    // Return location object
    return {
        filename: parts[0],
        line: lineno,
        src: parts[2],
    };
}

function isLocation(line) {
    return parseLocation(line) !== null;
}

function RDB(stream) {
    if(this instanceof RDB === false) {
        return new RDB(stream);
    }

    RDB.super_.call(this, stream);
}
inherits(RDB, require('./base'));

RDB.prototype._isStacktrace = function(buffer) {
    var lines = buffer.split('\n');

    // All lines in a stack trace are location lines
    if(!_.all(_.map(lines, isLocation))) return false;

    // All lines except first start with "\tfrom"
    return _.all(_.rest(lines), function(line) {
        return line.indexOf('\tfrom') === 0;
    });
};

RDB.prototype.isError = function(buffer) {
    return this._isStacktrace(buffer);
};

RDB.prototype.commands = {
    'eval': {
        cmd: 'p'
    },
    'continue': {
        cmd: 'cont'
    },
    'breakpoint.list': {
        cmd: 'break'
    },
    'breakpoint.line': {
        cmd: 'break'
    },
    'breakpoint.func': {
        cmd: 'break'
    },
    'backtrace': {
        cmd: 'where'
    },
    'locals': {
        // Hackish dump of values to JSON ...
        cmd: 'var local',
        result: function(data) {
            var lines = data.split(os.EOF);
            return _.objet(_.map(lines, function(line) {
                return line.trimLeft().split(' => ', 2);
            }));
        }
    },
};

// Exports
module.exports = RDB;