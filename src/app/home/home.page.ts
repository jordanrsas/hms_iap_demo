import { Component } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { HMSInAppPurchases} from '@hmscore/ionic-native-hms-iap/ngx'
import { environment } from 'src/environments/environment';

const DEVELOPERPAYLOAD = "HMSCoreDeveloper"
const DEVELOPERCHALLENGE = "HMSCoreDeveloperChallenge"

const PRICETYPE = {
  CONSUMABLE: 0,
  NONCONSUMABLE: 1,
  SUBSCRIPTION: 2,
}

const PRODUCTS = {
  consumable: {
    type: PRICETYPE.CONSUMABLE,
    products: [{
      id: 'gem_001',
      name: 'Elemento Consumible, Gema 1'
    },
    {
      id: 'gem_002',
      name: 'Elemento Consumible, Gema 2'
    }]
  }
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  public products = {
    consumable: [],
    purchased_consumable: [],
    purchased_record_consumable: [],
  }

  constructor(private iap: HMSInAppPurchases,
    private loadingController: LoadingController) {}

  createPurchaseIntent = async (product, productType) => {
    this.showLoader();
    try{
      let message = await this.iap.createPurchaseIntent({
        priceType: product.priceType,
        productId: product.productId,
        reservedInfor: null,
        developerPayload: DEVELOPERPAYLOAD
      });

      this.hideLoader();
      console.log(message);
      alert(message);
      alert(JSON.stringify(message));

      if (message.returnCode === 0) {// if successful
        this.products = {
          consumable: [],
          purchased_consumable: [],
          purchased_record_consumable: [],
        };
        this.ngOnInit();
      }else{
        alert('Purchase was not successful.')
      }
    }catch (err) {
      this.hideLoader();
      console.log(err);
    }
  }

  consumeOwnedPurchase = async (productId, purchaseData, productType) => {
    try{
      let message = await this.iap.consumeOwnedPurchase({
        inAppPurchaseData: purchaseData,
        developerChallenge: DEVELOPERCHALLENGE,
      });

      if (message.returnCode === 0) {// if successful
        this.products = {
          consumable: [],
          purchased_consumable: [],
          purchased_record_consumable: [],
        };
        this.ngOnInit();
      } else {
        alert(JSON.stringify(message, null, 4))
        console.log('Consume was not successful.')
      }
    }catch(err){
      console.log(err);
    }
  }

  ngOnInit(){
    this.iap.isEnvReady().then(environment =>{
      console.log(environment);
    }).catch(err => {
      console.log(err);
    })

    this.iap.isSandboxActivated().then(sandbox => {
      console.log(sandbox)
      this.getProductsInformation();
    }).catch(err =>{
      console.log(err);
    })
  }

  getProductsInformation = () => {
    Object.keys(PRODUCTS).map(async pType => {
      await this.obtainProductInfoFromType(pType)
      await this.obtainOwnedPurchasesFromType(pType)
      if (pType === 'consumable' || pType === 'subscription') {
        await this.obtainOwnedPurchaseRecordFromType(pType)
      }
    })
  }

  obtainProductInfoFromType = async (pType) => {
    try{
      let message = await this.iap.obtainProductInfo({
        priceType: PRODUCTS[pType].type,
        productList: PRODUCTS[pType].products.map(p => p.id)
      });
      console.log(message);
      message.productInfoList.map(product => this.createAvailableProductOnList(product, pType))
    }catch(err){
      console.log(err);
    }
  }

  obtainOwnedPurchasesFromType = async (pType) => {
    try{
      let message = await this.iap.obtainOwnedPurchases({
        priceType: PRODUCTS[pType].type
      });
      console.log(message);
      message.itemList.map((pId, ind) => this.createPurchasedProductOnList(pId, message.inAppPurchaseDataList[ind], pType))
    }catch(err){
      console.log(err);
    }
  }

  obtainOwnedPurchaseRecordFromType = async (pType) => {
    try {
      let message = await this.iap.obtainOwnedPurchaseRecord({
        priceType: PRODUCTS[pType].type
      });
      console.log(message);
      message.itemList.map(pId => this.createPurchasedRecordProductOnList(pId, pType))
    } catch (err) {
      console.log(err);
    }
  }
  
  createPurchasedProductOnList = (productId, purchaseData, productType) => {
    let product = this.getProduct(productId, productType);
    product.purchaseData = purchaseData;
    switch (productType) {
      case "consumable":
        this.products.purchased_consumable.push(product);
        break;
      default:
        break;
    }
  }

  createPurchasedRecordProductOnList = (productId, productType) => {
    const product = this.getProduct(productId, productType)
    switch (productType) {
      case "consumable":
        this.products.purchased_record_consumable.push(product);
        break;
      default:
        break;
    }
  }

  createAvailableProductOnList = (product, productType) => {
    switch (productType) {
      case "consumable":
        this.products.consumable.push(product);
        break;
      default:
        break;
    }
  }

  getProduct = (productId, productType) => {
    const pList = PRODUCTS[productType].products.filter(p => p.id === productId)
    return pList.length > 0 ? pList[0] : { id: 'id', name: 'name' }
  }
  
  showLoader(){
    this.loadingController.create({
      message : "Porfavor espere ..."
    }).then((loading) =>{
      loading.present();
    })
  }

  hideLoader(){
    this.loadingController.dismiss().then((res) =>{
      console.log('Loading dismissed!', res);
    }).catch((err) =>{
      console.log('error', err);
    })
  }

}
