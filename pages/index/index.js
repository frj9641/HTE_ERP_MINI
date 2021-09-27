const APP = getApp()

// fixed首次打开不显示标题的bug
APP.configLoadOK = () => {
  wx.setNavigationBarTitle({
    title: wx.getStorageSync('mallName')
  })
}

Page({
  data: {
    showGoodsDetailPOP: false, // 是否显示商品详情
    bar: 'i'
  },
  onLoad: function (e) {
    this.loadChemicals()
    wx.setNavigationBarTitle({
      title: 'HTE仓管系统'
    })
    // 读取最近的门店数据
    this.getshopInfo()
  },
  onShow: function () {

  },
  getshopInfo() {
    wx.getLocation({
      type: 'wgs84', //wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标
      success: (res) => {
        this.fetchShops(res.latitude, res.longitude)
      },
      fail(e) {
        AUTH.checkAndAuthorize('scope.userLocation')
      }
    })
  },
  // 坐标匹配对应商店
  async fetchShops(latitude, longitude) {
    wx.request({
      url: 'http://localhost/factory?latitude=' + latitude + '&longtitude=' + longitude,
      method: 'GET',
      success(res) {
        console.log(res)
      }
    })
  },
  // 加载药剂信息
  loadChemicals() {
    var that = this
    wx.request({
      url: 'http://localhost/chemical?factoryId=1',
      success(res) {
        res.data.forEach(ele => {
          ele.storage = ele.storage.toFixed(2) // 距离保留3位小数
        })
        that.setData({
          chemicals: res.data
        })
      }
    })
  },
  updateRep() {
    var that = this.data
    var i = this
    if (that.bar == 'i') {
      if (!that.selectedProvierId) {
        wx.showToast({
          title: "请选择供应商",
          icon: 'none'
        })
        return
      }
      if (!that.amount) {
        wx.showToast({
          title: "请输入入库吨数",
          icon: 'none'
        })
        return
      }
      if (!that.price) {
        wx.showToast({
          title: "请输入货品单价",
          icon: 'none'
        })
        return
      }
      if (!that.carriage) {
        wx.showToast({
          title: "请输入货品运费",
          icon: 'none'
        })
        return
      }
      wx.showModal({
        title: '入库确认',
        content: '新增库存：' + that.amount + '吨 ' + that.chemical.chemicalPO.chemicalName + '，供应商为：' +
          that.selectedProvierName + '，单价：' + that.price + '元/吨，运费：' + that.carriage + '元/吨，总价：' + that.money + '元',
        success(res) {
          if (res.confirm) {
            wx.request({
              url: 'http://localhost/input',
              method: 'POST',
              header: {
                'content-type': 'application/x-www-form-urlencoded'
              },
              data: {
                factoryId: 1,
                providerId: that.selectedProvierId,
                chemicalId: that.chemical.chemicalPO.chemicalId,
                amount: that.amount,
                price: that.price,
                carriage: that.carriage,
                money: that.money
              },
              success() {
                i.hideGoodsDetailPOP()
                wx.showToast({
                  title: '入库成功',
                  icon: 'success'
                })
                i.loadChemicals()
              }
            })
          }
        }
      })
    } else {
      if (!that.amount) {
        wx.showToast({
          title: "请输入入库吨数",
          icon: 'none'
        })
        return
      }
      wx.showModal({
        title: '出库确认',
        content: '移出库存：' + that.amount + '吨 ' + that.chemical.chemicalPO.chemicalName,
        success(res) {
          if (res.confirm) {
            wx.request({
              url: 'http://localhost/output',
              method: 'POST',
              header: {
                'content-type': 'application/x-www-form-urlencoded'
              },
              data: {
                factoryId: 1,
                chemicalId: that.chemical.chemicalPO.chemicalId,
                amount: that.amount,
              },
              success(res) {
                if (res.data == true) {
                  i.hideGoodsDetailPOP()
                  wx.showToast({
                    title: '出库成功',
                    icon: 'success'
                  })
                  i.loadChemicals()
                } else {
                  wx.showToast({
                    title: '出库失败',
                    icon: 'error'
                  })
                }
              }
            })
          }
        }
      })
    }
  },
  // 规格选择项
  skuClick(e) {
    var selectedProvierId = e.currentTarget.dataset.idx
    var selectedProvierName = e.currentTarget.dataset.name
    this.setData({
      selectedProvierId: selectedProvierId,
      selectedProvierName: selectedProvierName
    })
  },
  amountChange(e) {
    this.setData({
      amount: e.detail,
    })
    this.calculateMoney()
  },
  priceChange(e) {
    this.setData({
      price: e.detail
    })
    this.calculateMoney()
  },
  carriageChange(e) {
    this.setData({
      carriage: e.detail
    })
    this.calculateMoney()
  },
  calculateMoney() {
    var that = this.data
    var money1 = that.amount * that.price
    var money2 = that.amount * that.carriage
    var money = money1 + money2
    this.setData({
      money: money.toFixed(2)
    })
  },
  inputBar() {
    this.setData({
      bar: 'i'
    })
  },
  outputBar() {
    this.setData({
      bar: 'o'
    })
  },
  historyBar() {
    var that = this
    this.setData({
      bar: 'h'
    })
    wx.request({
      url: 'http://localhost/input?factoryId=1',
      method: 'GET',
      success(res) {
        that.setData({
          history: res.data
        })
      }
    })
  },
  showGoodsDetailPOP(e) {
    this.setData({
      showGoodsDetailPOP: true
    })
    var chemical = this.data.chemicals[e.currentTarget.dataset.idx]
    this.setData({
      chemical: chemical
    })
  },
  hideGoodsDetailPOP() {
    this.setData({
      showGoodsDetailPOP: false,
      amount: "",
      price: "",
      carriage: "",
      selectedProvierId: "",
      chemical: "",
      selectedProvierName: "",
      money: ""
    })
  },
})