import { Component, OnInit, TemplateRef } from '@angular/core';
import { Observable } from 'rxjs';
import { ICategory } from 'src/app/shared/interfaces/category.interface';
import { BsModalService, BsModalRef, ModalOptions } from 'ngx-bootstrap/modal';
import { AngularFireStorage } from '@angular/fire/storage';
import { CategoriesService } from 'src/app/shared/services/categories.service';
import { ProductsService } from 'src/app/shared/services/products.service';
import { Product } from 'src/app/shared/classes/product.model';
import { IProduct } from 'src/app/shared/interfaces/product.interface';
import { ProgressbarConfig } from 'ngx-bootstrap/progressbar';

export function getProgressbarConfig(): ProgressbarConfig {
  return Object.assign(new ProgressbarConfig(), { animate: true, striped: true,  max: 100 });
}

@Component({
  selector: 'app-admin-products',
  templateUrl: './admin-products.component.html',
  styleUrls: ['./admin-products.component.scss'],
  providers: [{ provide: ProgressbarConfig, useFactory: getProgressbarConfig }]
})
export class AdminProductsComponent implements OnInit {
  searchProductName: string;
  categoryName: string;
  categories: Array<ICategory>;
  currentCategory: ICategory;
  isEdited = false;
  isChecked = false;
  isLoaded = false;
  modalLG = 'modal-lg modal-dialog-centered';
  modalSM = 'modal-sm modal-dialog-centered';
  productID: number | string;
  productDescription: string;
  productName: string;
  productPrice: number;
  productImage: string;
  products: Array<IProduct>;
  product: IProduct;
  uploadPercent: Observable<number>;
  modalRef: BsModalRef;
  checkModel: any = { left: false, middle: true, right: false };
  constructor(private catService: CategoriesService, private prodService: ProductsService, private modalService: BsModalService, private storage: AngularFireStorage) { }

  ngOnInit(): void {
    this.getCategories();
    this.getProducts();
  }

  private getCategories(): void {
    this.catService.getCategories().subscribe(
      data => {
        this.categories = data;
        this.currentCategory = this.categories[0];
      }
    );
  }

  private getProducts(): void {
    this.prodService.getProducts().subscribe(
      data => {
        this.products = data;
      }
    );
  }

  setCategory(): void {
    this.currentCategory = this.categories.filter(cat => cat.name === this.categoryName)[0];
  }

  resetForm(): void {
    this.categoryName = '';
    this.productDescription = '';
    this.productName = '';
    this.productPrice = undefined;
    this.productImage = '';
    this.isLoaded = false;
  }

  checkProductFields(): void {
    if (this.categoryName == '' || this.productName == '' || this.productDescription == '' || this.productPrice == undefined || this.productImage == '') this.isChecked = true;
  }

  addProduct(): void {
    this.setCategory();
    this.checkProductFields();
    if (this.isChecked == false) {
      const newProd = new Product(
        1,
        this.currentCategory,
        this.productName,
        this.productDescription,
        this.productPrice,
        1,
        this.productImage
      );
      delete newProd.id;
      this.prodService.postProduct(newProd).subscribe(() => {
        this.getProducts();
      })
      this.modalRef.hide();
      this.resetForm();
      this.isChecked = false;
    }
  }

  getProduct(product: IProduct): void {
    this.product = product;
  }

  deleteProduct(prod: IProduct): void {
    this.prodService.deleteProduct(prod).subscribe(() => {
      this.getProducts();
    });
    this.modalRef.hide();
  }

  editProduct(product: IProduct): void {
    this.productID = product.id;
    this.currentCategory = product.category;
    this.categoryName = product.category.name;
    this.productName = product.name;
    this.productDescription = product.description;
    this.productPrice = product.price;
    this.productImage = product.image;
    this.isEdited = true;
  }

  updateProduct(): void {
    this.checkProductFields();
    if (this.isChecked == false){
      const updProduct = new Product(this.productID, this.currentCategory, this.productName, this.productDescription, this.productPrice, 1, this.productImage);
      this.prodService.updateProduct(updProduct).subscribe(() => {
        this.getProducts();
      });
      this.modalRef.hide();
      this.resetForm();
      this.isEdited = false;
      this.isChecked = false;
    }
  }

  openModal(template: TemplateRef<any>, modalWidth): void {
    const config: ModalOptions = { class: `${modalWidth}` };
    this.modalRef = this.modalService.show(template, config);
  }

  uploadFile(event) {
    const file = event.target.files[0];
    const filePath = `images/${file.name}`;
    const ref = this.storage.ref(filePath);
    const task = ref.put(file);
    this.uploadPercent = task.percentageChanges();
    task.then(image => {
      this.storage.ref(`images/${image.metadata.name}`).getDownloadURL().subscribe(url => {
        this.productImage = url;
        this.isLoaded = true;
      });
    });
  }
}
