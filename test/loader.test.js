import webpack from './helpers/compiler';

describe('Loader', () => {
  test('Defaults', async () => {
    const config = {
      mode: 'development',
      loader: {
        test: /\.coffee?$/,
        options: {
          coffeeify: true,
        },
      },
      module: {
        rules: [
          {
            test: /\.coffee?$/,
            loader: `${__dirname}/../src/cjs?coffeeify`,
          },
        ],
      },
    };

    const stats = await webpack('fixture.js', config);
    const { modules } = stats.toJson({ source: true });
    const [, module] = modules;
    const { source } = module;

    expect(source).toMatchSnapshot();
  });
});
