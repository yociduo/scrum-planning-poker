class Component {
  constructor(options = {}) {
    Object.assign(this, { options });
    this.__init();
  }

  /**
  * 初始化
  */
  __init() {
    this.page = getCurrentPages()[getCurrentPages().length - 1];
    const setData = this.page.setData.bind(this.page);

    //重写setData方法
    this.setData = (obj = {}, cb = () => ({})) => {
      const fn = () => {
        if (typeof cb === 'function') {
          cb();
        }
      };
      setData(obj, fn);
    }

    this.__initState();
  }

  /**
  * 初始化组件状态
  */
  __initState() {
    this.options.data && this.__initData();
    this.options.methods && this.__initMthods();
  }

  /**
  * 绑定组件数据
  */
  __initData() {
    const scope = this.options.scope;
    const data = this.options.data;
    this._data = {};

    if (!this.isEmptyObject(data)) {
      for (let key in data) {
        if (data.hasOwnProperty(key)) {
          if (typeof data[key] === 'function') {
            data[key] = data[key].bind(this);
          } else {
            this._data[key] = data[key];
          }
        }
      }
    }

    // 将数据同步到 page.data 方便组件渲染
    this.page.setData({
      [`${scope}`]: this._data
    });
  }

  /**
  * 绑定组件方法
  */
  __initMthods() {
    const scope = this.options.scope;
    const methods = this.options.methods;

    if (!this.isEmptyObject(methods)) {
      for (let key in methods) {
        if (methods.hasOwnProperty(key) && typeof methods[key] === 'function') {
          this[key] = methods[key] = methods[key].bind(this);
          //将组件内的方法重命名并挂载到 page 上， 否则 template 上找不到方法
          this.page[`${scope}.${key}`] = methods[key];

          //将方法同步到 page.data 上，方便 template 使用 {{methods}} 绑定事件
          this.page.setData({
            [`${scope}.${key}`]: `${scope}.${key}`
          });
        }
      }
    }
  }

  /**
  * 获取组件数据
  */
  getComponentData() {
    let data = this.page.data;
    let name = this.options.scope && this.options.scope.split(".");

    name.forEach((n, i) => {
      data = data[n];
    });

    return data;
  }

  /**
  * 判断 Object 是否为空
  */
  isEmptyObject(e) {
    for (let t in e)
      return !1
    return !0;
  }

  /**
  * 设置元素显示
  */
  setVisible() {
    this.setData({
      [`${this.options.scope}.visible`]: !0
    });
  }

  /**
  * 设置元素隐藏
  */
  setHidden(timer = 300) {
    setTimeout(() => {
      this.setData({
        [`${this.options.scope}.visible`]: !1
      });
    }, timer);
  }
}

export default Component;
