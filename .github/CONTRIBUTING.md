# Contributing

**The issue tracker is only for bug reports and enhancement suggestions. If you
have a question, please ask me directly on Discord (Lioness100#4566) instead of
opening an issue**

If you wish to contribute to the Arima project's codebase or documentation, feel
free to fork the repository and submit a pull request. For larger changes,
please open an issue first so we can discuss.

## Requirements

- [x] We use [ESLint](https://eslint.org) and [Prettier](https://prettier.io/)
      to enforce a consistent coding style. Any PR that does not follow the
      linting rules will not be merged until the formatting is resolved.

## Setup

To get ready to work on the codebase, please do the following:

1. Fork & clone the repository, and make sure you're on the **main** branch
2. Run `yarn`
3. Fill out [`.env.example`](../.env.example) (you can find your soundcloud api
   key [here](https://runkit.com/lioness100/602153c28cacf5001ae3c7e7) and rename
   it to [`.env`](../.env)
4. Code your heart out!

### Starting Arima

```sh
yarn && yarn dev
```

5. [Submit a pull request](./PULL_REQUEST_TEMPLATE)
