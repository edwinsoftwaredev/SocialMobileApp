import { HttpResponse, HttpErrorResponse } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { ModalDialogParams } from "nativescript-angular";
// require("nativescript-nodeify");
import * as BitmapFactory from "nativescript-bitmap-factory";
// require("nativescript-nodeify");
import * as imagepicker from "nativescript-imagepicker";
import { ImageAsset } from "tns-core-modules/image-asset";
import { fromAsset, ImageSource, fromBase64 } from "tns-core-modules/image-source";
import { Color, Page } from "tns-core-modules/ui/page";
import { decode } from "typescript-base64-arraybuffer";
import { FilePostService } from "~/app/entities/file-post/file-post.service";
import { FilePost, IFilePost } from "~/app/shared/model/file-post.model";
import { ILike } from "~/app/shared/model/like.model";
import { IPost, Post } from "~/app/shared/model/post.model";
import { IUsuario } from "~/app/shared/model/usuario.model";
import { Account, Principal } from "../core";
import { PostService } from "../entities/post/post.service";
import { UsuarioService } from "../entities/usuario/usuario.service";
import * as moment from "moment";
import * as app from "tns-core-modules/application";
import * as utils from "tns-core-modules/utils/utils";
import * as frame from "tns-core-modules/ui/frame";

@Component({
  selector: "ns-new-post-modal",
  templateUrl: "./new-post-modal.component.html",
  moduleId: module.id
})
export class NewPostModalComponent implements OnInit {

  id: number;
  usuario: IUsuario;
  likes: Array<ILike>;
  texto: string = "";
  url: string = "";
  fechaPublicacion: moment.Moment;
  filePost: Array<any> = [];
  postToEdit: IPost = null;
  imagePreview: ImageSource = null;
  imagePreviewToSave: string = null;
  loaderView = null;

  private imageList: Array<ImageAsset>;

  private imagePickerContext = imagepicker.create({
    mode: "single" // use "multiple" for multiple selection
  });

  constructor(private _params: ModalDialogParams,
              private page: Page,
              private filePostService: FilePostService,
              private principalService: Principal,
              private usuarioService: UsuarioService,
              private postService: PostService) { }

  ngOnInit() {
    if (this._params.context.postToEdit !== null && typeof this._params.context.postToEdit !== "undefined") {
      this.postToEdit = this._params.context.postToEdit;
      this.updatePost(this.postToEdit);
    } else {
      this.postToEdit = null;
    }
  }

  seleccionarArchivos() {
    this.imagePickerContext
        .authorize()
        .then(() => {
          return this.imagePickerContext.present();
        })
        .then((selection) => {
          selection.forEach((selected) => {
            // this.showLoaderIndicator();

            // process the selected image
            fromAsset(selected).then((image: ImageSource) => {

              let image2: ImageSource = null;

              const bmp = BitmapFactory.create(image.width, image.height);

              bmp.dispose((bmp1) => {
                bmp1.insert(BitmapFactory.makeMutable(image));

                // una forma de compresion seria decodificar a uint8array ver el tamaños del arreglo
                // y si es mayor a 75000 bytes bajar calidad de la imagen --> hacerlo recursivamente

                let bmp2 = null;

                if (image.height > 400) {
                  bmp2 = bmp1.resizeHeight(400);
                }

                if (image.width > 900) {
                  bmp2 = bmp1.resizeWidth(900);
                }

                if (image.height <= 400 && image.width <= 900) {
                  bmp2 = bmp1;
                }

                image2 = bmp2.toImageSource();

                // this.imagePreview = "data:" + "image/jpeg;base64," + image2.toBase64String("jpeg", 80);

                // this.imagePreview = fromBase64(image2.toBase64String("jpeg", 80));

                this.imagePreview = image2;

              });
            });

            // this.hideLoadingIndicator();

          });
          this.imageList = selection;
          // this.hideLoadingIndicator();
        }).catch((e)  => {
      // this.hideLoadingIndicator();
      console.log(e);
    });
  }

  showLoaderIndicator() {

    if (this.loaderView) {
      return;
    }

    if (!app.android) {
      utils.ios.getter(UIApplication, UIApplication.sharedApplication).beginIgnoringInteractionEvents();

      const currentView = frame.topmost().ios.controller.view;
      this.loaderView = UIView.alloc().initWithFrame(CGRectMake(0, 0, 90, 90));
      this.loaderView.center = currentView.center;
      this.loaderView.layer.cornerRadius = 4;
      this.loaderView.backgroundColor = new Color("#CC000000").ios;

      const indicator =
        UIActivityIndicatorView.alloc().initWithActivityIndicatorStyle(UIActivityIndicatorViewStyle.WhiteLarge);
      indicator.center = CGPointMake(45, 45);

      this.loaderView.addSubview(indicator);
      currentView.addSubview(this.loaderView);

      indicator.startAnimating();
    } else {
      this.loaderView = android.app.ProgressDialog.show(app.android.foregroundActivity,
        "",
        "Loading...");
    }

  }

  hideLoadingIndicator() {
    if (!this.loaderView) {
      return;
    }

    if (!app.android) {
      this.loaderView.removeFromSuperview();
      utils.ios.getter(UIApplication, UIApplication.sharedApplication).endIgnoringInteractionEvents();
    }

    if (app.android) {
      this.loaderView.dismiss();
    }

    this.loaderView = null;
  }
  
  savePost() {
    const filesPost: Array<IFilePost> = [];

    this.showLoaderIndicator();
    // evalua si el post existe, es decir, si lo que se quiere es editar el post
    if (this.postToEdit) {
        this.principalService.identity().then((account: Account) => {
            this.usuarioService.findUsuario(account.login).subscribe((resUsuario: HttpResponse<IUsuario>) => {
                this.usuario = resUsuario.body;

                const postToUpdate = new Post(
                    this.postToEdit.id,
                    this.texto,
                    this.url,
                    this.postToEdit.fechaPublicacion,
                    null,
                    null,
                    this.postToEdit.usuario
                );

                const postToEditx = this.postToEdit;

                this.postService.update(postToUpdate).subscribe((res: HttpResponse<IPost>) => {
                    const postUpdated = this.convertDateFromServer(res).body;

                    this.filePostService.deleteAllFilesByPost(postUpdated.id).subscribe((resDel: HttpResponse<any>) => {
                        const filePostService = this.filePostService;
                        let cantArchivos = 0;

                        // se obtiene la cantidad de archivos (imagenes y archivos)
                        // en movil solo se tendra la posibilidad de eliminar IMAGENES de momento
                        // En caso de tener un contenedor de archivos o imagenes ver primero
                        // implementacion en app movile
                        if (this.postToEdit.filePosts) {
                          cantArchivos = this.postToEdit.filePosts.length;
                        }

                        if (cantArchivos !== 0 || this.imagePreview !== null) {

                          // si el preview(puede ser un contenedor de archivos)
                          // esta vacio se eliminan todas las IMAGENES
                          if (this.imagePreview === null) {
                            const indiceImagen: Array<number> = null;

                            // tslint:disable-next-line
                            for (let i = 0; i < this.postToEdit.filePosts.length; i++) {
                              if (this.postToEdit.filePosts[i].fileContentType.toString().slice(0, 5) === "image") {
                                indiceImagen.push(i);
                              }
                            }

                            indiceImagen.forEach((indice) => {
                              this.postToEdit.filePosts.splice(indice, 1);
                            });
                          }

                          if (cantArchivos === 0 && this.imagePreview !== null) {

                            this.imagePreviewToSave = this.imagePreview.toBase64String("jpeg", 80);

                            // const binaryFile = Array.from(decode(this.imagePreview.toString().split(",")[1]));

                            const binaryFile = Array.from(decode(this.imagePreviewToSave));

                            filePostService
                            .create(new FilePost(undefined, "image/jpeg", binaryFile, postUpdated)).subscribe(
                              (resFilePost: HttpResponse<IFilePost>) => {
                                  filesPost.push(resFilePost.body);
                              },
                              (resError: HttpErrorResponse) => {
                                this.hideLoadingIndicator();
                                console.log(resError.message);
                              },
                              () => {
                                postUpdated.filePosts = filesPost;
                                postUpdated.likes = postToEditx.likes;
                                this.hideLoadingIndicator();
                                this._params.closeCallback(postUpdated);
                              }
                            );

                          } else {
                            this.postToEdit.filePosts.map((file) => {
                              // const binaryFile = Array.from(decode(this.imagePreview.toString().split(",")[1]));

                              const binaryFile = Array.from(decode(this.imagePreview.toBase64String("jpeg", 80)));

                              filePostService
                                .create(new FilePost(undefined, "image/jpeg", binaryFile, postUpdated)).subscribe(
                                  (resFilePost: HttpResponse<IFilePost>) => {
                                      filesPost.push(resFilePost.body);
                                  },
                                  (resError: HttpErrorResponse) => {
                                      this.hideLoadingIndicator();
                                      console.log(resError.message);
                                  },
                                  () => {
                                    postUpdated.filePosts = filesPost;
                                    postUpdated.likes = postToEditx.likes;
                                    this.hideLoadingIndicator();
                                    this._params.closeCallback(postUpdated);
                                  }
                                );
                            });
                          }

                        } else {
                            postUpdated.likes = postToEditx.likes;
                            this.hideLoadingIndicator();
                            this._params.closeCallback(postUpdated);
                        }
                    });
                });
            });
        });
    } else {
        // el post no existe por lo que se crea
        this.principalService.identity().then((account: Account) => {
            this.usuarioService.findUsuario(account.login).subscribe((resUsuario: HttpResponse<IUsuario>) => {
              this.usuario = resUsuario.body;

              // los chat ni las actividades se tienen que perder
              this.usuario.actividads = null;
              this.usuario.chats = null;
              /**
               * !!esta linea es importante porque si no se define como null las actividades del usuario
               * se genera un error de nullpointerexception en el servidor al ser enviado el usuario para
               * generar el post.
               * Este error lo produce jackson al querer deserealizar el objecto post. post -> usuario -> actidades
               * y al momento de traer el usuario se genera del lado del cliente como un arreglo de actividades vacio
               * por lo que debe de ser igualado a null si el usuario no tiene actividades. esto hay que arreglarlo
               * tambien para los likes.
               */

              if (this.texto !== "" || this.url !== "" || this.imagePreview !== null) {
                let newPost: IPost = new Post(undefined, this.texto, this.url, moment(), null, null, this.usuario);

                this.postService.create(newPost).subscribe(
                  (resPost: HttpResponse<IPost>) => {
                    newPost = this.convertDateFromServer(resPost).body;

                    const post = new Post(
                      newPost.id,
                      newPost.texto,
                      newPost.url,
                      newPost.fechaPublicacion,
                      undefined,
                      undefined,
                      newPost.usuario
                    );

                    const filePostService = this.filePostService;
                    // hasta no tener un contedor de archivos usar la variable imagePreview
                    if (this.imagePreview !== null) {

                      // const binaryFile = Array.from(decode(this.imagePreview.toString().split(",")[1]));
                      const binaryFile = Array.from(decode(this.imagePreview.toBase64String("jpeg", 80)));

                      filePostService
                        .create(new FilePost(undefined, "image/jpeg", binaryFile, post))
                        .subscribe(
                          (res: HttpResponse<IFilePost>) => {
                            filesPost.push(res.body);
                          },
                          (res: HttpErrorResponse) => {
                            this.hideLoadingIndicator();
                            console.log(res.message);
                          },
                          () => {
                            newPost.filePosts = filesPost;
                            this.hideLoadingIndicator();
                            this._params.closeCallback(newPost);
                            // sucede que en la app web si no se coloca este filtro se cierra la ventana
                            // modal. puede ser de utilidad en la app movil
                            /*if (cantArchivos === filesPost.length) {
                                newPost.filePosts = filesPost;
                                dialogRef1.close(newPost);
                            }*/
                          }
                        );
                    } else {

                      // se iguala a arreglo vacio para evitar error undefined
                      post.likes = [];
                      post.filePosts = [];
                      this.hideLoadingIndicator();
                      this._params.closeCallback(post);
                    }
                  },
                  (resError: HttpErrorResponse) => {
                    this.hideLoadingIndicator();
                    console.log(resError.message);
                  }
                );
              } else {
                this.hideLoadingIndicator();
                this._params.closeCallback("Se cerro modal");
              }
            });
        });
    }
  }

  convertDateFromServer(res: HttpResponse<IPost>): HttpResponse<IPost> {
    if (res.body) {
        res.body.fechaPublicacion = res.body.fechaPublicacion != null ? moment(res.body.fechaPublicacion) : null;
    }

    return res;
  }

  updatePost(post: IPost) {
    this.id = post.id;
    this.url = post.url;
    if (post.likes) {
        this.likes = post.likes;
    } else {
        this.likes = null;
    }
    this.likes = post.likes;
    this.texto = post.texto;
    this.usuario = post.usuario;
    this.fechaPublicacion = post.fechaPublicacion;

    if (post.filePosts) {

      let primeraImagen = false; // este es un flag para tomar solo una imagen del post

      post.filePosts.map((file) => {
        
        if (!primeraImagen) {
          if (file.fileContentType.toString().slice(0, 5) === "image") {
            primeraImagen = true;
            // this.imagePreview = this.getSanitizedUrl(file.file, file.fileContentType);
            // this.imagePreviewToSave = file.file;
            this.imagePreview = fromBase64(file.file);
          }
        }
        
      });
        
    } else {
        this.filePost = null;
    }
  }

  getSanitizedUrl(file: any, fileContentType: string) {
    if (file.toString().charAt(0) === "d") {
      return file.toString();
    } else {
      return "data:" + fileContentType + ";base64," + file;
    }
  }

  onClose(): void {
    this._params.closeCallback("Se cerro modal");
  }

}
