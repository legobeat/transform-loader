/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
const reBase64 = '\\s*[@#]\\s*sourceMappingURL=data:[^;\n]+;base64,([^\\s]*)';

// Matches /* ... */ comments
const reBlockComment = new RegExp(`/\\*${reBase64}\\s*\\*/$`);

// Matches // .... comments
const reSlashComment = new RegExp(`//${reBase64}.*$`);

export default function loader(input) {
  if (!this.query) {
    throw new TypeError('Pass a module name as query to the transform-loader.');
  }

  const query = this.getOptions() || {};
  const callback = this.async();
  const { resource } = this;
  const [q] = Object.keys(query);

  if (query.transforms && /^[0-9]+$/.test(q)) {
    next(query.transforms[+q]);
  } else if (query.transform) {
    next(query.transform);
  } else {
    // eslint-disable-next-line consistent-return
    this.resolve(this.context, q, (err, module) => {
      if (err) return callback(err);
      // eslint-disable-next-line global-require, import/no-dynamic-require
      next(require(module));
    });
  }

  function next(transformFn) {
    const stream = transformFn(resource);
    const bufs = [];
    let map = null;
    let done = false;

    stream.on('data', (b) => {
      bufs.push(Buffer.isBuffer(b) ? b : new Buffer(b));
    });

    stream.on('end', () => {
      if (done) {
        return;
      }

      const b = Buffer.concat(bufs).toString();
      const match = b.match(reBlockComment) || b.match(reSlashComment);

      try {
        map = match && JSON.parse(new Buffer(match[1], 'base64').toString());
      } catch (e) {
        map = null;
      }

      done = true;
      callback(null, map ? b.replace(match[0], '') : b, map);
    });

    stream.on('error', (err) => {
      if (done) {
        return;
      }

      done = true;
      callback(err);
    });

    stream.write(input);
    stream.end();
  }
}

export const raw = true;
