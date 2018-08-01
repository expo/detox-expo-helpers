# detox-expo-helpers

Utilities for using [detox](http://github.com/wix/detox) in your Expo/Create React Native App apps.

## Dependencies
`detox-expo-helpers` requires your app to use the Expo SDK 29.0.0 or greater.

## Use it

### Install it

```
yarn add detox-expo-helpers -D
 # or
npm i detox-expo-helpers --save-dev
```

### Set up detox on your project

Follow the steps in the detox [Getting Started](https://github.com/wix/detox/blob/master/docs/Introduction.GettingStarted.md) guide.

In your `init.js` file, set the `global.__E2E__` flag to `true` before your tests begin, like so:
```js
beforeAll(async () => {
  global.__E2E__ = true
  await detox.init(config)
})
```

This will tell the Expo client to run in a mode compatible with E2E testing.


### Download the Expo app to some directory in your project and configure in package.json

You can download the Expo app from the [Expo Tools page](https://expo.io/tools). See an [example package.json configuration](https://github.com/expo/with-detox-tests/blob/033020b165452d641f512a9b1a8a291632ce8e8f/package.json#L21-L29)

### Use detox-expo-helpers in your app

All you really need to use is `reloadApp`, like so: https://github.com/expo/with-detox-tests/blob/master/e2e/firstTest.spec.js#L1-L6

## Example app

Try out an example app with this already configured at https://github.com/expo/with-detox-tests
