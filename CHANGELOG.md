# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [3.3.2](https://github.com/yociduo/scrum-planning-poker/compare/v3.3.1...v3.3.2) (2020-09-20)


### Features

* add change story name ([91bb2f9](https://github.com/yociduo/scrum-planning-poker/commit/91bb2f9af2c9aba843cb1fc03e56a7ce8726faf3))
* add input box dialog component ([092e20b](https://github.com/yociduo/scrum-planning-poker/commit/092e20b053df4a48141b839b96560a8699911d73))
* delete room for host ([1851cd9](https://github.com/yociduo/scrum-planning-poker/commit/1851cd9e7eac53abf154cfb79891bdfb75f650aa))
* implement change user name ([312a8bb](https://github.com/yociduo/scrum-planning-poker/commit/312a8bbc621917ee7b9e8ecbb70c3b12e870e8c7))
* update story name ([e8c0ab0](https://github.com/yociduo/scrum-planning-poker/commit/e8c0ab0527a0b0e5e6335884c97099c0471839e7))


### Bug Fixes

* update back and on input error ([af9537b](https://github.com/yociduo/scrum-planning-poker/commit/af9537b91cb10fa0df772feba53a7d76bc367d7e))

### [3.3.1](https://github.com/yociduo/scrum-planning-poker/compare/v3.3.0...v3.3.1) (2020-05-25)


### Features

* add expires in to the config ([1cf1d41](https://github.com/yociduo/scrum-planning-poker/commit/1cf1d410dbc53d037793ea16e7dd252a8cb6fb5f))


### Bug Fixes

* add union unique index to prevent user join twice ([2b3e77c](https://github.com/yociduo/scrum-planning-poker/commit/2b3e77c5e318fd064dced4ee7d72c076f9fe7aed))
* **disconnect:** call leave when disconnect ([30a46be](https://github.com/yociduo/scrum-planning-poker/commit/30a46be085cee30100447f182a07e247062c109c))
* **jwt-expired:** handle jwt expired case ([451898a](https://github.com/yociduo/scrum-planning-poker/commit/451898aeeee65ff683359727afef13061ae704bc))
* set all user leave the room when start ([b47c9e9](https://github.com/yociduo/scrum-planning-poker/commit/b47c9e9ca701d08644d035b7f5372a987a263971))

## [3.3.0](https://github.com/yociduo/scrum-planning-poker/compare/v3.2.1...v3.3.0) (2020-05-05)


### Features

* show/hide score ([3907bd2](https://github.com/yociduo/scrum-planning-poker/commit/3907bd27c5ff0dc189f3c13979c10cbcb505cba9))
* **toptip:** add toptip component to show messagge ([6113edd](https://github.com/yociduo/scrum-planning-poker/commit/6113eddb72890f8b73082c0d7ee578f3c953fc5f))


### Bug Fixes

* wait 300ms to find userRoom again ([1642be2](https://github.com/yociduo/scrum-planning-poker/commit/1642be281a4dad89983ec53694949e3c6324f116))

### [3.2.1](https://github.com/yociduo/scrum-planning-poker/compare/v3.2.0...v3.2.1) (2020-03-16)


### Features

* **entity:** add isDeleted and update select option for each entity ([a0cab2d](https://github.com/yociduo/scrum-planning-poker/commit/a0cab2d638a0645b9f5469e728ebeeeb0d48164f))
* **poker:** split stories from room ([783ecaa](https://github.com/yociduo/scrum-planning-poker/commit/783ecaa2f9d2af148b0ca699a1fd2bda8aa69b0b))
* **room:** update get by user func ([6a2a878](https://github.com/yociduo/scrum-planning-poker/commit/6a2a87834709f3e300cfa6f2afd56054ff31fd85))
* **typeorm:** using query build instead of raw sql ([ac72dc4](https://github.com/yociduo/scrum-planning-poker/commit/ac72dc4323c47f2b95cefb7826193a39ecc42164))


### Bug Fixes

* **log:** update home controller log ([d6b9735](https://github.com/yociduo/scrum-planning-poker/commit/d6b973523b093248251e6193ca02ddc7451ea44d))
* **login:** user name and avatar should be refresh after login ([d6e889e](https://github.com/yociduo/scrum-planning-poker/commit/d6e889e72ec8d25c13f137f9f314e27789e031c1))
* **range:** change column type form smallint to int ([c938aae](https://github.com/yociduo/scrum-planning-poker/commit/c938aae260a2ae01ea86862abbd45ac6992ca23d))

## [3.2.0](https://github.com/yociduo/scrum-planning-poker/compare/v3.1.0...v3.2.0) (2020-03-16)


### Features

* **guest:** display id for user ([c3a3c8c](https://github.com/yociduo/scrum-planning-poker/commit/c3a3c8c67ca62023ba677d2cbf334cf03b803ccd))
* **log:** add socket user id in connect and disconnect log ([ac498fb](https://github.com/yociduo/scrum-planning-poker/commit/ac498fb2f73227bc174a6a2fb27061fc0dc73cea))
* **login:** add get user info in the create button ([a8beccc](https://github.com/yociduo/scrum-planning-poker/commit/a8beccc40a6149a0053f83a8d9cec27baa6cdccf))
* **login:** not block guest user ([d00374f](https://github.com/yociduo/scrum-planning-poker/commit/d00374f30e25c048af8cfba7c396536624a29f36))
* **verify:** add token expired time ([91e49b6](https://github.com/yociduo/scrum-planning-poker/commit/91e49b65d47471e5f5a627102e5be88de24a297d))


### Bug Fixes

* **jwt:** token logic not correct ([abd9a6c](https://github.com/yociduo/scrum-planning-poker/commit/abd9a6c8cc66763bcda5f80889cb0fe978cd8367))
* **jwt:** token logic not correct ([9199e58](https://github.com/yociduo/scrum-planning-poker/commit/9199e58185d781287407ada6a340c065833d8696))
* **sign:** "expiresIn" should be a number ([4b24cce](https://github.com/yociduo/scrum-planning-poker/commit/4b24cceb11db9dc9af4131f90243e8aa1840a291))
* **wechat:** wechat 7.0.10 block loading list ([f3cd6d8](https://github.com/yociduo/scrum-planning-poker/commit/f3cd6d8591c87e67d7733a1d4765cb76d5c0afa6))
