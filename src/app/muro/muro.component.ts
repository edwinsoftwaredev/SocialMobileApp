import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef
} from "@angular/core";
import { RadSideDrawer, SlideInOnTopTransition, FadeTransition } from "nativescript-ui-sidedrawer";
// tslint:disable-next-line
import * as app from "tns-core-modules/application";
// tslint:disable-next-line
import { AndroidActivityEventData, AndroidApplication, getRootView } from "tns-core-modules/application";
import { IUsuario, Usuario } from "~/app/shared/model/usuario.model";
import { IPost, Post } from "~/app/shared/model/post.model";
import { Observable } from "rxjs";
import { Account, LoginService, Principal } from "~/app/core";
import { UsuarioService } from "~/app/entities/usuario/usuario.service";
import { RelacionService } from "~/app/entities/relacion/relacion.service";
import { PostService } from "~/app/entities/post/post.service";
import { LikeService } from "~/app/entities/like/like.service";
import { SocketService } from "~/app/shared/socket.service";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { ModalDialogOptions, ModalDialogService, RouterExtensions } from "nativescript-angular";
import { IFilePost } from "~/app/shared/model/file-post.model";
import { ILike, Like } from "~/app/shared/model/like.model";
import { ObservableArray } from "tns-core-modules/data/observable-array";
import { setTimeout } from "tns-core-modules/timer";
import {
  ListViewEventData,
  ListViewItemAnimation,
  ListViewItemSnapMode,
  ListViewLinearLayout,
  LoadOnDemandListViewEventData,
  RadListView
} from "nativescript-ui-listview";
import { action } from "tns-core-modules/ui/dialogs";
import { ModalRootNewPostComponent } from "~/app/new-post-modal/modal-root-new-post/modal-root-new-post.component";
import { EventData } from "tns-core-modules/data/observable";
import { Label } from "tns-core-modules/ui/label";
import * as utils from "tns-core-modules/utils/utils";
import * as moment from "moment";
import { fromBase64, ImageSource } from "tns-core-modules/image-source";
import { PushViewModelService } from "~/app/shared/push-view-model.service";
import { NavigatedData, Page } from "tns-core-modules/ui/page";
import { MuroService } from "~/app/muro/muro.service";
import { PanelService } from "~/app/shared/panel.service";

@Component({
  selector: "ns-muro",
  templateUrl: "./muro.component.html",
  moduleId: module.id
})
export class MuroComponent implements OnInit, AfterViewInit, OnDestroy {

  usuario: IUsuario;
  picUrl: any;
  postUsuario: Array<IPost> = [];
  postLikesUsuario: Array<IPost> = [];
  scrollPage = 0;
  fullPosts: ObservableArray<IFullPost>;
  _sourceDataItems: ObservableArray<IFullPost>;
  profiles: Array<IPerfil> = [];
  isAndroid: boolean;
  activityIndicator: boolean = true;
  hayPostFlag: boolean = true;

  drawer: RadSideDrawer;

  loadingLikeFlag: boolean = false;

  @ViewChild("muroListView") muroListView: ElementRef<RadListView>;
  @ViewChild("myListViewLinearLayout") myListViewLinearLayout: ElementRef<ListViewLinearLayout>;

  private _itemInsertAnimation: ListViewItemAnimation = null;
  private _itemDeleteAnimation: ListViewItemAnimation = null;

  constructor(
      private principal: Principal,
      private usuarioService: UsuarioService,
      private relacionService: RelacionService,
      private postService: PostService,
      // private dataUtils: JhiDataUtils, --> importante para abrir archivos adjuntos
      private likeService: LikeService,
      private socketService: SocketService,
      private routerExtensions: RouterExtensions,
      private changeDetectionRef: ChangeDetectorRef,
      private login: LoginService,
      private _modalService: ModalDialogService,
      private _vcRef: ViewContainerRef,
      private zone: NgZone,
      private pushViewModelService: PushViewModelService,
      private muroService: MuroService,
      private page: Page,
      private panelService: PanelService
  ) {
  }

  get itemInsertAnimation(): ListViewItemAnimation {
    return this._itemInsertAnimation;
  }

  set itemInsertAnimation(value: ListViewItemAnimation) {
    this._itemInsertAnimation = value;
  }

  get itemDeleteAnimation(): ListViewItemAnimation {
    return this._itemDeleteAnimation;
  }

  set itemDeleteAnimation(value: ListViewItemAnimation) {
    this._itemDeleteAnimation = value;
  }

  ngOnInit() {

    this.panelService.selectInicioItemSideDrawerSubject.next(true);

    this.itemInsertAnimation = ListViewItemAnimation.Slide;
    this.itemDeleteAnimation = ListViewItemAnimation.Slide;

    this.page.on(Page.unloadedEvent, (event) => {
      this.ngOnDestroy();
    });

    if (app.android) {
      this.isAndroid = true;
    }

    if (app.android) {
      utils.ad.dismissSoftInput(app.android.foregroundActivity);
    } else {
      utils.ios.getter(UIApplication, UIApplication.sharedApplication)
        .keyWindow
        .endEditing(true);
    }

    this.fullPosts = this.muroService.fullPosts;
    this._sourceDataItems = this.muroService.sourceDataItems;

    this.getUsuario();

    this.profiles = [];

    // this.socketMessages();
    // this.observeNewPosts(); --> en web observa que el dialog de nuevos post se haya cerrado
    // this.observeNewRelaciones(); --> en web observa que las relaciones que se defina en el searchbar

    // si se presiona el boton de atras en el muro se realiza desconexion de socket
    if (app.android) {
      app.android.on(AndroidApplication.activityBackPressedEvent, (data: AndroidActivityEventData) => {

        if (this.routerExtensions.router.routerState.snapshot.url === "/muro" && !this.routerExtensions.canGoBack()) {
          setTimeout(() => {
            this.socketService.closeStompSocket();
          }, 300);
        }

      });
    }

    setTimeout(() => {
      this.page.on("navigatedTo", (args: NavigatedData) => {
        if (args.isBackNavigation) {
          try {
            if (this.muroListView) {
              this.itemInsertAnimation = ListViewItemAnimation.Default;
              this.itemDeleteAnimation = ListViewItemAnimation.Default;

              this.muroListView.nativeElement.resumeUpdates(true);

              setTimeout(() => {
                this.itemInsertAnimation = ListViewItemAnimation.Slide;
                this.itemDeleteAnimation = ListViewItemAnimation.Slide;
              }, 600);

              this.panelService.selectInicioItemSideDrawerSubject.next(true);

            }
          } catch (e) {
            console.log(e.toString());
          }

          return;
        }
      });
    }, 100);
  }

  ngOnDestroy(): void {
    // *
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.drawer = <RadSideDrawer>getRootView();
      this.drawer.gesturesEnabled = true;
    }, 100);
  }

  templateSelector(item: IFullPost, index: number, items: Array<IFullPost>) {
    if (item.postImages.length !== 0) {
      return "big";
    }

    /*if (item.type === "small" && item.imageUrl) {
      return "small";
    }*/

    if (item.postImages.length === 0) {
      return "small-no-image";
    }

    console.log("Unrecognized template!");
  }

  popMenu(args: EventData) {

    const label = <Label>args.object;

    // hay casos que para obtener el context en android se tiene que usar
    // app.android.foregroundActivity
    // o
    // app.android.context

    const menu = new android.support.v7.widget.PopupMenu(app.android.foregroundActivity, label.nativeView);

    menu.getMenu().add("Crear Post").setIcon(utils.ad.resources.getDrawableId("baseline_crop_original_24"));

    // tslint:disable-next-line
    const self: MuroComponent = this;

    menu.setOnMenuItemClickListener(new android.support.v7.widget.PopupMenu.OnMenuItemClickListener({
      onMenuItemClick(param0: android.view.MenuItem): boolean {

        if (param0.getTitle() === "Crear Post") {
          self.zone.run(() => {
            self.openModalCrearPost(self);
          });
        }

        return true;
      }
    }));

    const menuHelper = new android.support.v7.view.menu.MenuPopupHelper(app.android.foregroundActivity,
      <android.support.v7.view.menu.MenuBuilder>menu.getMenu(), label.nativeView);

    menuHelper.setForceShowIcon(true);
    menuHelper.show();

    // menu.show();
  }

  popMenuIOS(args: EventData) {

    const options = {
      actions: ["Crear Post"]
    };

    action(options).then((resultado) => {
      if (resultado === "Crear Post") {
        this.openModalCrearPost(this);
      }
    });

  }

  getUsuario() {
    this.principal.identity().then((account: Account) => {
      this.usuarioService.findUsuario(account.login).subscribe(
          (res: HttpResponse<IUsuario>) => {
            this.usuario = res.body;

            // se valida que el app esta registrada para recibir notificaciones
            // sino se hace el registro
            this.pushViewModelService.validateRegistration();

            this.changeDetectionRef.markForCheck();

            // se crea socket
            // this.socketService.initializeWebSocketConnection(); --> ver si es necesaria esta instruccion

            // esto se hace para que al enviar el usuario no se envie un arreglo vacio de
            // actividades sino que vaya el valor sin definirse
            if (res.body.actividads) {
              this.usuario.actividads = res.body.actividads;
            } else {
              this.usuario.actividads = undefined;
            }

            if (res.body.chats) {
              this.usuario.chats = res.body.chats;
            } else {
              this.usuario.chats = undefined;
            }

            // const picUrlString = "data:" + this.usuario.profilePicContentType + ";base64," + this.usuario.profilePic;
            // this.picUrl = this.sanitizer.bypassSecurityTrustUrl(picUrlString);
            this.picUrl = this.getSanitizedUrl(this.usuario.profilePic, this.usuario.profilePicContentType);

            this.loadAll();
          },
          (res: HttpResponse<any>) => {
            console.log(res.headers.get("content-length") === "0");

            if (res.headers.get("content-length") === "0") {
              this.login.logout();
              /*this.routerExtensions.navigate(["/profile-details-form"], {
                transition: {
                  name: "slide"
                }
              });*/
            }
          }
      );
    });
  }

  loadAll() {
    this.postService.findAllPostsByUsuario(this.usuario.usuario).subscribe((res: HttpResponse<Array<IPost>>) => {
      this.postUsuario = res.body;
    });

    this.postService.findAllLikesPostUsuarioByUsuario(this.usuario.id).subscribe((res: HttpResponse<Array<IPost>>) => {
      this.postLikesUsuario = res.body;
    });

    this.getEntryPosts();
  }

  getEntryPosts() {
    this.activityIndicator = true;

    this.postService
      .findPostWallByUsuarioIdPageable(this.usuario.id, this.scrollPage, 4)
      .subscribe((res: HttpResponse<Array<IPost>>) => {

        if (!res.body.length) {
          this.hayPostFlag = false;
        }

        // tslint:disable-next-line
        for (let i = 0; i < res.body.length; i++) {

          this.activityIndicator = false;

          setTimeout(() => {
            const postImagesArray: Array<IImageFullPost> = [];
            const postFilesArray: Array<IFileFullPost> = [];

            res.body[i].filePosts
              .filter((file: IFilePost) => file.fileContentType
                .substr(file.fileContentType.indexOf("image"), 5) === "image")
              .map((file) => {
                postImagesArray
                  .push(new ImageFullPost(this.getSanitizedUrl(file.file, file.fileContentType)));
              });

            res.body[i].filePosts
              .filter((file: IFilePost) => file.fileContentType
                .substr(file.fileContentType.indexOf("image"), 5) !== "image")
              .map((file) => {
                postFilesArray.push(new FileFullPost(file.file, file.fileContentType, "File"));
              });

            this.muroService.fullPosts.push({
              sourcePost: res.body[i],
              postImages: postImagesArray,
              filesPost: postFilesArray,
              fechaPublicacionPost: this.getFechaPublicacionPost(res.body[i]),
              profilePicSanitized:
                this.getSanitizedUrl(res.body[i].usuario.profilePic, res.body[i].usuario.profilePicContentType)
            });
          }, (i + 1) * 500);

        }
      }, (error) => {
        this.hayPostFlag = false;

        this.activityIndicator = false;
      }, () => {
        this.activityIndicator = false;
      });
  }

  showPostMenu(event, post: IPost) {
    const options = {
      actions: ["Editar Post", "Eliminar Post"]
    };

    action(options).then((resultado) => {

      if (resultado === "Editar Post") {

        const modalOptions: ModalDialogOptions = {
          viewContainerRef: this._vcRef,
          context: {
            postToEdit: post
          },
          fullscreen: true,
          animated: true,
          stretched: true
        };

        this._modalService.showModal(ModalRootNewPostComponent, modalOptions)
            .then((result: any) => {

              if (result !== "Se cerro modal") {
                if (result) {

                  this.hayPostFlag = true;
                  // this.muroListView.nativeElement.resumeUpdates(true); <-- Esta instruccion puede ser necesaria

                  const resPost: IPost = result;
                  // resPost.likes = [];
  
                  const postImagesArray: Array<IImageFullPost> = [];
                  const postFilesArray: Array<IFileFullPost> = [];
  
                  if (typeof resPost.filePosts !== "undefined" && resPost.filePosts !== null) {
                      resPost.filePosts
                          .filter((file: IFilePost) =>
                            file.fileContentType.substr(file.fileContentType.indexOf("image"), 5) === "image")
                          .map((file) => {
                              postImagesArray
                                .push(new ImageFullPost(this
                                  .getSanitizedUrl(file.file, file.fileContentType)));
                          });
  
                      resPost.filePosts
                          .filter((file: IFilePost) =>
                            file.fileContentType.substr(file.fileContentType.indexOf("image"), 5) !== "image")
                          .map((file) => {
                              postFilesArray.push(new FileFullPost(file.file, file.fileContentType, "File"));
                          });
                  }

                  let indicePost: number = null;

                  // se obtine indice si existe del post que se pueda eliminar
                  // tslint:disable-next-line
                  for (let i = 0; i < this.muroService.fullPosts.length; i++) {
                    if (this.muroService.fullPosts.getItem(i).sourcePost.id === resPost.id) {
                      indicePost = i;
                      break;
                    }
                  }

                  // se elimina el post del arreglo
                  /*if (indicePost !== null) {
                    this.fullPosts.splice(indicePost, 1);
                  }*/

                  // el codigo anterior se elimina ya que si se elimina el elemento en el indice dado
                  // otro elemento ocupa su lugar

                  if (indicePost !== null) {

                    this.muroService.fullPosts.splice(indicePost, 1,
                      {
                        sourcePost: resPost,
                        postImages: postImagesArray,
                        filesPost: postFilesArray,
                        fechaPublicacionPost: this.getFechaPublicacionPost(resPost),
                        profilePicSanitized:
                          this.getSanitizedUrl(resPost.usuario.profilePic, resPost.usuario.profilePicContentType)
                      }
                    );
                    this.muroListView.nativeElement.resumeUpdates(true);

                    // this.muroListView.nativeElement.scrollToIndex(indicePost, true, ListViewItemSnapMode.Center);

                    indicePost = null;
                  } else {
                    this.muroService.fullPosts.unshift({
                      sourcePost: resPost,
                      postImages: postImagesArray,
                      filesPost: postFilesArray,
                      fechaPublicacionPost: this.getFechaPublicacionPost(resPost),
                      profilePicSanitized:
                        this.getSanitizedUrl(resPost.usuario.profilePic, resPost.usuario.profilePicContentType)
                    });

                    this.muroListView.nativeElement.scrollToIndex(0, true, ListViewItemSnapMode.Center);
                  }
                  
                  // buscar toast para nativscript que indique que se creo un post
                  /*this.snackBar.open("Creaste un nuevo Post", null, {
                      duration: 2500
                  });*/
                }
              }
            });

      } else if (resultado === "Eliminar Post") {
          // eliminar de manera completa el post es decir full post
          this.postService.deleteFullPost(post.id).subscribe(
            (res: HttpResponse<any>) => {
              
              let indicePost: number = null;

              // se obtine indice si existe del post que se pueda eliminar
              // tslint:disable-next-line
              for (let i = 0; i < this.muroService.fullPosts.length; i++) {
                if (this.muroService.fullPosts.getItem(i).sourcePost.id === post.id) {
                  indicePost = i;
                  break;
                }
              }

              // se elimina el post del arreglo
              if (indicePost !== null) {
                this.muroService.fullPosts.splice(indicePost, 1);
                indicePost = null;
              }

              /*if (this.usuario.id === post.usuario.id) {
                  this.cantLikes = this.cantLikes - post.likes.length;
                  this.cantPosts--;
                  if (this.fullPosts.length === 0) {
                      this.noHayPosts = true;
                  }
              }*/

              if (!this.muroService.fullPosts.length) {
                this.hayPostFlag = false;
              }
            },
            (res: HttpErrorResponse) => {
                console.log(res.message);
            }
        );
      }
    });
  }

  openModalCrearPost(self: MuroComponent): void {
    const modalOptions: ModalDialogOptions = {
      viewContainerRef: self._vcRef,
      context: {
        postToEdit: null
      },
      fullscreen: true,
      animated: true,
      stretched: true
    };

    self._modalService.showModal(ModalRootNewPostComponent, modalOptions)
      .then((result: any) => {

        if (result !== "Se cerro modal") {
          if (result) {
            const resPost: IPost = result;
            // resPost.likes = [];

            this.hayPostFlag = true;

            const postImagesArray: Array<IImageFullPost> = [];
            const postFilesArray: Array<IFileFullPost> = [];

            if (typeof resPost.filePosts !== "undefined" && resPost.filePosts !== null) {
              resPost.filePosts
                .filter((file: IFilePost) =>
                  file.fileContentType.substr(file.fileContentType.indexOf("image"), 5) === "image")
                .map((file) => {
                  postImagesArray
                    .push(new ImageFullPost(self
                      .getSanitizedUrl(file.file, file.fileContentType)));
                });

              resPost.filePosts
                .filter((file: IFilePost) =>
                  file.fileContentType.substr(file.fileContentType.indexOf("image"), 5) !== "image")
                .map((file) => {
                  postFilesArray.push(new FileFullPost(file.file, file.fileContentType, "File"));
                });
            }

            let indicePost: number = null;

            // se obtine indice si existe del post que se pueda eliminar
            // tslint:disable-next-line
            for (let i = 0; i < self.muroService.fullPosts.length; i++) {
              if (self.muroService.fullPosts.getItem(i).sourcePost.id === resPost.id) {
                indicePost = i;
                break;
              }
            }

            // se elimina el post del arreglo
            if (indicePost !== null) {
              self.muroService.fullPosts.splice(indicePost, 1);
            }

            if (indicePost !== null) {

              // como es un nuevo post se iguala a arreglo vacio para evitar error undefined
              resPost.likes = [];

              self.muroService.fullPosts.setItem(indicePost, {
                sourcePost: resPost,
                postImages: postImagesArray,
                filesPost: postFilesArray,
                fechaPublicacionPost: self.getFechaPublicacionPost(resPost),
                profilePicSanitized:
                  self.getSanitizedUrl(resPost.usuario.profilePic, resPost.usuario.profilePicContentType)
              });

              indicePost = null;

              if (self.isAndroid) {
                self.muroListView.nativeElement.scrollToIndex(0);
              } else {
                self.muroListView.nativeElement.scrollToIndex(0);
              }

            } else {

              // como es arreglo vacio se iguala a arreglo vacio para evitar error undefined
              resPost.likes = [];

              self.muroService.fullPosts.unshift({
                sourcePost: resPost,
                postImages: postImagesArray,
                filesPost: postFilesArray,
                fechaPublicacionPost: self.getFechaPublicacionPost(resPost),
                profilePicSanitized:
                  self.getSanitizedUrl(resPost.usuario.profilePic, resPost.usuario.profilePicContentType)
              });

              if (self.isAndroid) {
                self.muroListView.nativeElement.scrollToIndex(0, true, ListViewItemSnapMode.Center);
              } else {
                self.muroListView.nativeElement.scrollToIndex(0, true, ListViewItemSnapMode.Center);
              }

            }

            // buscar toast para nativscript que indique que se creo un post
            /*this.snackBar.open("Creaste un nuevo Post", null, {
                duration: 2500
            });*/
          }
        }
      });
  }

  onPullToRefreshInitiated(args: ListViewEventData) {
    this.scrollPage = 0;

    setTimeout(() => {
      this.postService
        .findPostWallByUsuarioIdPageable(this.usuario.id, this.scrollPage, 4)
        .subscribe((res: HttpResponse<Array<IPost>>) => {

          this.muroService.fullPosts.length = 0;
          this.muroService.sourceDataItems.length = 0;

          if (!res.body.length) {
            this.hayPostFlag = false;
          } else {
            this.hayPostFlag = true;
          }

          // tslint:disable-next-line
          for (let i = 0; i < res.body.length; i++) {

            setTimeout(() => {
              const postImagesArray: Array<IImageFullPost> = [];
              const postFilesArray: Array<IFileFullPost> = [];

              res.body[i].filePosts
                .filter((file: IFilePost) => file.fileContentType
                  .substr(file.fileContentType.indexOf("image"), 5) === "image")
                .map((file) => {
                  postImagesArray
                    .push(new ImageFullPost(this.getSanitizedUrl(file.file, file.fileContentType)));
                });

              res.body[i].filePosts
                .filter((file: IFilePost) => file.fileContentType
                  .substr(file.fileContentType.indexOf("image"), 5) !== "image")
                .map((file) => {
                  postFilesArray.push(new FileFullPost(file.file, file.fileContentType, "File"));
                });

              this.muroService.fullPosts.push({
                sourcePost: res.body[i],
                postImages: postImagesArray,
                filesPost: postFilesArray,
                fechaPublicacionPost: this.getFechaPublicacionPost(res.body[i]),
                profilePicSanitized:
                  this.getSanitizedUrl(res.body[i].usuario.profilePic, res.body[i].usuario.profilePicContentType)
              });
            }, (i + 1) * 500);
          }

          const listView = args.object;
          listView.notifyPullToRefreshFinished(true);

        });
    }, 1000);
  }

  onLoadMoreItemsRequested(args: LoadOnDemandListViewEventData) {
    const that = new WeakRef(this);
    const listView: RadListView = args.object;
    if (this.muroService.sourceDataItems.length > 0) {

      setTimeout(() => {
        that.get().addMoreItemsFromSource(2);
        listView.notifyLoadOnDemandFinished();
      }, 500);

    } else {

      this.scrollPage++;

      this.postService
        .findPostWallByUsuarioIdPageable(this.usuario.id, this.scrollPage, 4)
        .subscribe((res: HttpResponse<Array<IPost>>) => {
          if (res.body.length) {
            res.body.map((post: IPost) => {
              const postImagesArray: Array<IImageFullPost> = [];
              const postFilesArray: Array<IFileFullPost> = [];

              post.filePosts
                .filter(
                  (file: IFilePost) => file.fileContentType.substr(file.fileContentType.indexOf("image"), 5) === "image"
                )
                .map((file) => {
                  postImagesArray.push(
                    new ImageFullPost(this.getSanitizedUrl(file.file, file.fileContentType))
                  );
                });

              post.filePosts
                .filter(
                  (file: IFilePost) => file.fileContentType.substr(file.fileContentType.indexOf("image"), 5) !== "image"
                )
                .map((file) => {
                  postFilesArray.push(new FileFullPost(file.file, file.fileContentType, "File"));
                });

              this.muroService.sourceDataItems.push({
                sourcePost: post,
                postImages: postImagesArray,
                filesPost: postFilesArray,
                fechaPublicacionPost: this.getFechaPublicacionPost(post),
                profilePicSanitized: this.getSanitizedUrl(post.usuario.profilePic, post.usuario.profilePicContentType)
              });

              setTimeout(() => {
                that.get().addMoreItemsFromSource(2);
                listView.notifyLoadOnDemandFinished();
              }, 500);

            });
          } else {
            args.returnValue = false;
            listView.notifyLoadOnDemandFinished(true);
          }
        });
    }
  }

  addMoreItemsFromSource(chunkSize: number) {
    const newItems = this.muroService.sourceDataItems.splice(0, chunkSize);
    this.muroService.fullPosts.push(newItems);
  }

  getCantlikesString(post): string {
    return "&#xe8dc;&nbsp;" + post.sourcePost.likes.length;
  }

  validateLike(postLikes: Array<ILike>): boolean {
    if (postLikes) {
        if (postLikes.filter((like) => like.usuarioLike !== null)
                .filter((like) => like.usuarioLike.id === this.usuario.id)[0]) {
                return false;
        }
    }

    return true;
  }

  setLike(post: IFullPost) {

    this.loadingLikeFlag = true;

    // tslint:disable-next-line
    const v_post: IPost = new Post(post.sourcePost.id,
      post.sourcePost.texto,
      post.sourcePost.url,
      post.sourcePost.fechaPublicacion);

    const usuarioDaLike: IUsuario = new Usuario(
        this.usuario.id,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
    );
        // el server solo necesita el id del usuario que da like sino se genera nullpointerexception por jackson

    const newLike: ILike = new Like(undefined, moment(), v_post, usuarioDaLike);

    // aqui se envia el post para hacer push un like de la base
    this.subscribeToSaveResponse(this.likeService.create(newLike), post.sourcePost);
  }

  deleteLike(post: IFullPost) {

    this.loadingLikeFlag = true;

    const idLike: number = post.sourcePost.likes.filter((like) => like.usuarioLike.id === this.usuario.id)[0].id;

    this.likeService.delete(idLike).subscribe(
            (res: HttpResponse<any>) => {
              post.sourcePost.likes = post.sourcePost.likes.filter((like) => like.usuarioLike.id !== this.usuario.id)
                .map((like) => like);

              this.loadingLikeFlag = false;
            },
            (res: HttpErrorResponse) => {
              console.log(res.message);
              this.loadingLikeFlag = false;
            }
        );
  }

  getFechaPublicacionPost(post: IPost): string {
    return post.fechaPublicacion.calendar();
  }

  getSanitizedUrl(file: any, fileContentType: string): ImageSource {

    if (file.toString().charAt(0) === "d") {
      return fromBase64(file.toString().split(",")[1]);
    } else {
      return fromBase64(file);
    }
  }

  onDrawerButtonTap(): void {
    const sideDrawer = <RadSideDrawer>app.getRootView();
    sideDrawer.initNativeView();
    sideDrawer.drawerTransition = new SlideInOnTopTransition();
    sideDrawer.initNativeView();
    sideDrawer.showDrawer();
  }

  private subscribeToSaveResponse(result: Observable<HttpResponse<ILike>>, post: IPost) {
    result.subscribe(
      (res: HttpResponse<ILike>) => {
        // console.log('se creo like');
        post.likes.push(res.body);
        this.loadingLikeFlag = false;
      },
      (res: HttpErrorResponse) => {
        this.loadingLikeFlag = false;
        console.log("no se creo like");
      }
    );
  }
}

export interface IPerfil {
  firstNameLastName: string;
  firstNameLastNameSpaced: string;
  usuario: string;
  amigos: boolean;
  envieSolicitud: boolean;
  envioSolicitud: boolean;
  profilePicUrlSanitized: any;
  profilePicContentType: string;
  id: number;
}

export interface IFullPost {
  sourcePost?: IPost;
  postImages?: Array<IImageFullPost>;
  filesPost?: Array<IFileFullPost>;
  profilePicSanitized?: ImageSource;
  fechaPublicacionPost?: string;
}

// tslint:disable-next-line
export class FullPost implements IFullPost {
  constructor(
      public sourcePost?: IPost,
      public postImages?: Array<IImageFullPost>,
      public filesPost?: Array<IFileFullPost>,
      public profilePicSanitized?: ImageSource,
      public fechaPublicacionPost?: string
  ) {}
}

export interface IImageFullPost {
  imageSource?: ImageSource;
}

// tslint:disable-next-line
export class ImageFullPost implements IImageFullPost {
  constructor(public imageSource?: ImageSource) {}
}

export interface IFileFullPost {
  src?: any;
  fileContentType?: string;
  fileName?: string;
}

// tslint:disable-next-line
export class FileFullPost implements IFileFullPost {
  constructor(public src?: any, public fileContentType?: string, public fileName?: string) {}
}
