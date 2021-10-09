const APP = getApp()

Page({
  data: {
    showGoodsDetailPOP: false, // 是否显示商品详情
    bar: 'i',
    showProductDetailPOP: false
  },
  onLoad: function (e) {
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
    var that = this
    wx.request({
      url: 'http://localhost/factory?latitude=' + latitude + '&longtitude=' + longitude,
      method: 'GET',
      success(res) {
        that.setData({
          factoryId: res.data.factoryId,
          factoryName: res.data.factoryName
        })
        that.loadChemicals(that.data.factoryId)
      }
    })
  },
  // 加载药剂信息
  loadChemicals(e) {
    var that = this
    wx.request({
      url: 'http://localhost/chemical?factoryId=' + e,
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
    if (that.bar == 'i' || that.bar == 'ai') {
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
                factoryId: that.factoryId,
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
                i.loadChemicals(that.factoryId)
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
                factoryId: that.factoryId,
                providerId: that.selectedProvierId,
                chemicalId: that.chemical.chemicalPO.chemicalId,
                amount: that.amount,
              },
              success(res) {
                if (res.data.isStorageOk) {
                  i.hideGoodsDetailPOP()
                  if (res.data.isProviderOk) {
                    wx.showToast({
                      title: '出库成功',
                      icon: 'success'
                    })
                  } else {
                    wx.showToast({
                      title: '出库成功，使用部分其余供应商药物替代',
                      icon: 'none',
                      duration: 5000
                    })
                  }
                  i.loadChemicals(that.factoryId)
                } else {
                  wx.showToast({
                    title: '出库失败，总库存量不足',
                    icon: 'none',
                    duration: 3000
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
    if (this.data.selectedProvierId == selectedProvierId) {
      this.setData({
        selectedProvierId: "",
        selectedProvierName: ""
      })
    } else {
      this.setData({
        selectedProvierId: selectedProvierId,
        selectedProvierName: selectedProvierName
      })
    }
  },
  skuClick1(e) {
    var selectedPortId = e.currentTarget.dataset.idx
    var selectedPortName = e.currentTarget.dataset.name
    if (this.data.selectedPortId == selectedPortId) {
      this.setData({
        selectedPortId: "",
        selectedPortName: ""
      })
    } else {
      this.setData({
        selectedPortId: selectedPortId,
        selectedPortName: selectedPortName
      })
    }
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
      url: 'http://localhost/input?factoryId=' + that.data.factoryId,
      method: 'GET',
      success(res) {
        that.setData({
          history: res.data
        })
      }
    })
  },
  adjustBar() {
    this.setData({
      bar: 'a'
    })
  },
  dataBar() {
    var that = this
    this.setData({
      bar: 'd'
    })
    wx.request({
      url: 'http://localhost/target?factoryId=' + that.data.factoryId,
      method: 'GET',
      success(res) {
        that.setData({
          ports: res.data.portPOList,
          targets: res.data.targetPOList
        })
      }
    })
  },
  productBar() {
    var that = this
    this.setData({
      bar: 'p'
    })
    wx.request({
      url: 'http://localhost/product?factoryId=' + that.data.factoryId,
      method: 'GET',
      success(res) {
        that.setData({
          ports: res.data.portPOList,
          products: res.data.productPOList
        })
      }
    })
  },
  showGoodsDetailPOP(e) {
    var that = this.data
    this.setData({
      showGoodsDetailPOP: true
    })
    if (that.bar == 'pi' || that.bar == 'po') {
      var product = this.data.products[e.currentTarget.dataset.idx]
      this.setData({
        product: product
      })
    } else if (that.bar == 'd') {
      var port = this.data.ports[e.currentTarget.dataset.idx]
      this.setData({
        port: port
      })
    } else {
      var chemical = this.data.chemicals[e.currentTarget.dataset.idx]
      this.setData({
        chemical: chemical
      })
    }
  },
  adjustIn(e) {
    this.setData({
      bar: 'ai'
    })
    this.showGoodsDetailPOP(e)
  },
  adjustOut(e) {
    this.setData({
      bar: 'ao'
    })
    this.showGoodsDetailPOP(e)
  },
  productIn(e) {
    this.setData({
      bar: 'pi'
    })
    this.showGoodsDetailPOP(e)
  },
  productOut(e) {
    this.setData({
      bar: 'po'
    })
    this.showGoodsDetailPOP(e)
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
      money: "",
      selectedPortId: "",
      selectedPortName: "",
      product: "",
      port: "",
      clear: ""
    })
  },
  submitProduct(e) {
    var f = e.detail.value
    var data = this.data
    var that = this
    if (!data.selectedPortId) {
      wx.showToast({
        title: "请选择采样口",
        icon: 'none'
      })
      return
    }
    if (!f.amount) {
      wx.showToast({
        title: "请输入吨数",
        icon: 'none'
      })
      return
    }
    if (data.bar == 'pi') {
      wx.showModal({
        title: '录入确认',
        content: '新增产出品：' + data.product.productName + f.amount + '吨 ' +
          '，采样口：' + data.selectedPortName,
        success(res) {
          if (res.confirm) {
            wx.request({
              url: 'http://localhost/product',
              method: 'POST',
              header: {
                'content-type': 'application/x-www-form-urlencoded'
              },
              data: {
                factoryId: data.factoryId,
                portId: data.selectedPortId,
                productId: data.product.productId,
                amount: f.amount,
                water: f.water,
                cu: f.cu,
                ni: f.ni,
                cr: f.cr,
                comment: f.comment
              },
              success() {
                that.hideGoodsDetailPOP()
                wx.showToast({
                  title: '录入成功',
                  icon: 'success'
                })
              }
            })
          }
        }
      })
    } else {
      wx.showModal({
        title: '录入确认',
        content: '减少产出品：' + data.product.productName + f.amount + '吨 ' +
          '，采样口：' + data.selectedPortName,
        success(res) {
          if (res.confirm) {
            wx.request({
              url: 'http://localhost/product',
              method: 'POST',
              header: {
                'content-type': 'application/x-www-form-urlencoded'
              },
              data: {
                factoryId: data.factoryId,
                portId: data.selectedPortId,
                productId: data.product.productId,
                amount: -f.amount,
                water: f.water,
                cu: f.cu,
                ni: f.ni,
                cr: f.cr,
                comment: f.comment
              },
              success() {
                that.hideGoodsDetailPOP()
                wx.showToast({
                  title: '录入成功',
                  icon: 'success'
                })
              }
            })
          }
        }
      })
    }
  },
  submitData(e) {
    var f = e.detail.value
    var data = this.data
    var that = this
    var flag = false
    Object.keys(f).forEach(ele => {
      if (f[ele] != "") flag = true
    })
    if (!flag) {
      wx.showToast({
        title: '至少输入一个指标值',
        icon: 'none'
      })
      return
    }
    Object.keys(f).map(ele => (!f[ele] ? delete f[ele] : ''))
    var result = ""
    Object.keys(f).forEach(ele => {
      result+=ele+":"+f[ele]+";"
    })
    console.log(result)
    wx.showModal({
      title: '录入确认',
      content: '录入指标:' + Object.keys(f),
      success(res) {
        if (res.confirm) {
          wx.request({
            url: 'http://localhost/target',
            method: 'POST',
            header: {
              'content-type': 'application/x-www-form-urlencoded'
            },
            data: {
              factoryId: data.factoryId,
              portId: data.port.portId,
              result: result
            },
            success() {
              that.hideGoodsDetailPOP()
              wx.showToast({
                title: '录入成功',
                icon: 'success'
              })
            }
          })
        }
      }
    })

  }
})