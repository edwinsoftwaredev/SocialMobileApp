import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { UsuarioService } from "~/app/entities/usuario/usuario.service";
import { Principal, Account } from "~/app/core";
import { IUsuario, Usuario } from "~/app/shared/model/usuario.model";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import {
  FileFullPost,
  IFileFullPost,
  IFullPost,
  IImageFullPost,
  ImageFullPost,
  IPerfil
} from "~/app/muro/muro.component";
import { fromBase64, ImageSource } from "tns-core-modules/image-source";
import { RelacionService } from "~/app/entities/relacion/relacion.service";
import { IRelacion, Relacion } from "~/app/shared/model/relacion.model";
import { IPost, Post } from "~/app/shared/model/post.model";
import { PostService } from "~/app/entities/post/post.service";
import { IFilePost } from "~/app/shared/model/file-post.model";
import * as moment from "moment";
import { ILike, Like } from "~/app/shared/model/like.model";
import { LikeService } from "~/app/entities/like/like.service";
import { Observable } from "~/rxjs";
import {
  ListViewEventData,
  ListViewScrollEventData,
  LoadOnDemandListViewEventData,
  RadListView
} from "nativescript-ui-listview";
import { setTimeout } from "tns-core-modules/timer";
import { ObservableArray } from "tns-core-modules/data/observable-array";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { SegmentedBar, SegmentedBarItem } from "tns-core-modules/ui/segmented-bar";
import { ScrollEventData, ScrollView } from "tns-core-modules/ui/scroll-view";
import { screen, ScreenMetrics } from "tns-core-modules/platform";
import { GridLayout } from "tns-core-modules/ui/layouts/grid-layout";
import { RouterExtensions } from "nativescript-angular";
import { ActionBar } from "tns-core-modules/ui/action-bar";
import { Color, NavigatedData, Page, View } from "tns-core-modules/ui/page";
// tslint:disable-next-line
import {
  ApplicationEventData, exitEvent, launchEvent, on, resumeEvent,
  suspendEvent
} from "tns-core-modules/application";
import * as utils from "tns-core-modules/utils/utils";

@Component({
  selector: "ns-visited-profile",
  templateUrl: "./visited-profile.component.html",
  moduleId: module.id
})
export class VisitedProfileComponent implements OnInit {

  usuario: IUsuario;
  usuarioVisitorName: string;
  usuarioVisitor: IUsuario;
  fullPosts: ObservableArray<IFullPost>;
  picUrl: ImageSource;
  picUrlBase64: string = "";
  relaciones: Array<IRelacion> = [];

  _sourceDataItems: ObservableArray<IFullPost> = new ObservableArray<IFullPost>([]);

  cantAmigos: number;
  cantLikes = 0;

  sonAmigos: boolean;
  usuarioVisitedEnvioSolicitud: boolean;
  usuarioVisitorEnvioSolicitud: boolean;
  cargandoEstadoRelacion: boolean = true ;

  perfilVistado: IPerfil;

  amigos: Array<IUsuario> = [];

  cantPosts: number;

  postUsuario: Array<IPost> = [];

  postLikesUsuario: Array<IPost> = [];

  scrollPage = 0;

  activityIndicator: boolean = true;

  noHayPosts: boolean;

  @ViewChild("postsListView") postsListView: ElementRef<RadListView>;
  @ViewChild("segmentedBarMenu") segmentedBarMenu: ElementRef<SegmentedBar>;
  @ViewChild("myScroller") myScroller: ElementRef<ScrollView>;
  @ViewChild("profileDetsGrid") profileDetsGrid: ElementRef<GridLayout>;
  @ViewChild("actionBar") actionBar: ElementRef<ActionBar>;
  @ViewChild("myRadList") myRadList: ElementRef<RadListView>;

  spinnerFlag: boolean = false;
  myItems: ObservableArray<IUsuario> = new ObservableArray<IUsuario>();

  items: Array<SegmentedBarItem>;
  selectedIndex = 0;

  screenHeight: number = 0;
  profileDetsGridHeight: number = 0;

  loadingLikeFlag: boolean = false;

  constructor(private usuarioService: UsuarioService,
              private principal: Principal,
              private relacionService: RelacionService,
              private postService: PostService,
              private likeService: LikeService,
              private routerExtensions: RouterExtensions,
              private page: Page) {

    this.page.on("navigatedTo", this.onNavigatedTo.bind(this));

    // this.picUrl = this.getSanitizedUrl(this.usuario.profilePic, this.usuario.profilePicContentType);

    this.items = [];

    const segmentedBarItemPosts = <SegmentedBarItem>new SegmentedBarItem();
    segmentedBarItemPosts.title = "Posts";
    const segmentedBarItemAmigos = <SegmentedBarItem>new SegmentedBarItem();
    segmentedBarItemAmigos.title = "Amigos";

    this.items.push(segmentedBarItemPosts);
    this.items.push(segmentedBarItemAmigos);

  }

  ngOnInit(): void {

    this.usuario = this.usuarioService.currentVisitedProfile;

    this.fullPosts = new ObservableArray<IFullPost>();

    if (app.android) {
      utils.ad.dismissSoftInput(app.android.foregroundActivity);
    } else {
      utils.ios.getter(UIApplication, UIApplication.sharedApplication)
        .keyWindow
        .endEditing(true);
    }

    setTimeout(() => {
      this.page.on("navigatedTo", (args: NavigatedData) => {
        if (args.isBackNavigation) {

          try {
            if (this.postsListView) {
              this.postsListView.nativeElement.resumeUpdates(true);
            }
          } catch (e) {
            console.log(e.toString());
          }

          return;
        }
      });
    }, 400);

    this.principal.identity().then((account: Account) => {
      this.usuarioVisitorName = account.login;

      this.usuarioService.findUsuario(this.usuarioVisitorName).subscribe((usuarioResponse: HttpResponse<IUsuario>) => {
        this.usuarioVisitor = usuarioResponse.body;
        this.getUsuario();
      });
    });
  }

  // esta funcion es llamada luego del que el envento declarado en el constructor
  // se haya ejecutado
  onNavigatedTo(arg?: NavigatedData): void {
    const screenScale = screen.mainScreen.scale;
    this.profileDetsGridHeight = this.profileDetsGrid.nativeElement.getMeasuredHeight() / screenScale;

    // screen sin soft button y sin profile grid. se agrega - 3 por un pequeño borde del segemented bar
    this.screenHeight = this.page.getActualSize().height - this.profileDetsGridHeight - 3;

    // formas de como obtener el alto del screen y el window
    // console.log(screen.mainScreen.heightDIPs); // altura screen
    // console.log(this.page.getActualSize().height); // altura window = screen sin soft buttons

  }

  onScrolled(args: ListViewScrollEventData) {

    // el desplazamiento se multiplica por 0.5 por que la pantalla es muy sensible
    this.myScroller.nativeElement.scrollToVerticalOffset(args.scrollOffset * 0.5, true);

  }

  onItemSelected(args: ListViewEventData) {

    const selectedItem: IUsuario = this.myItems.getItem(args.index);
    this.usuarioService.currentVisitedProfile = selectedItem;

    if (selectedItem.usuario !== this.usuarioVisitor.usuario) {
      this.myRadList
        .nativeElement
        .getViewForItem(this.myRadList.nativeElement.getItemAtIndex(args.index))
        .animate({
          backgroundColor: new Color("LightGray"),
          duration: 130
        });

      if (this.routerExtensions.router.isActive("/visited-profile", true)) {
        setTimeout(() => {
          // this.myRadList.nativeElement.refresh();
          this.routerExtensions.navigate(["/visited-profile1"]);
        }, 50);
      } else {
        setTimeout(() => {
          // this.myRadList.nativeElement.refresh();
          this.routerExtensions.navigate(["/visited-profile"]);
        }, 50);
      }
    }

  }

  onSelectedIndexChange(args) {
    const segmentedBar = <SegmentedBar>args.object;
    this.selectedIndex = segmentedBar.selectedIndex;
  }

  loadAll() {
    this.relacionService.findByUsuario(this.usuario.usuario).subscribe((res: HttpResponse<Array<IRelacion>>) => {
      this.relaciones = res.body;

      const rel: IRelacion =
        this.relaciones.filter((relacion: IRelacion) => relacion.amigoId === this.usuarioVisitor.id)[0];

      if (rel) {
        if (rel.amigoId === this.usuarioVisitor.id && rel.estado === true) {
          this.sonAmigos = true;
          this.usuarioVisitedEnvioSolicitud = false;
          this.usuarioVisitorEnvioSolicitud = false;
          this.cargandoEstadoRelacion = false;

          this.perfilVistado = {
            firstNameLastName:
              this.usuario.primerNombre +
              "" +
              this.usuario.segundoNombre +
              "" +
              this.usuario.primerApellido +
              "" +
              this.usuario.segundoApellido,
            firstNameLastNameSpaced:
              this.usuario.primerNombre +
              " " +
              this.usuario.segundoNombre +
              " " +
              this.usuario.primerApellido +
              " " +
              this.usuario.segundoApellido,
            usuario: this.usuario.usuario,
            amigos: this.sonAmigos,
            envioSolicitud: this.usuarioVisitedEnvioSolicitud,
            envieSolicitud: this.usuarioVisitorEnvioSolicitud,
            profilePicUrlSanitized: this.getSanitizedUrl(this.usuario.profilePic, this.usuario.profilePicContentType),
            profilePicContentType: this.usuario.profilePicContentType,
            id: this.usuario.id
          };
        } else if (rel.amigoId === this.usuarioVisitor.id && rel.estado === false) {
          this.sonAmigos = false;
          this.usuarioVisitedEnvioSolicitud = true;
          this.usuarioVisitorEnvioSolicitud = false;
          this.cargandoEstadoRelacion = false;

          this.perfilVistado = {
            firstNameLastName:
              this.usuario.primerNombre +
              "" +
              this.usuario.segundoNombre +
              "" +
              this.usuario.primerApellido +
              "" +
              this.usuario.segundoApellido,
            firstNameLastNameSpaced:
              this.usuario.primerNombre +
              " " +
              this.usuario.segundoNombre +
              " " +
              this.usuario.primerApellido +
              " " +
              this.usuario.segundoApellido,
            usuario: this.usuario.usuario,
            amigos: this.sonAmigos,
            envioSolicitud: this.usuarioVisitedEnvioSolicitud,
            envieSolicitud: this.usuarioVisitorEnvioSolicitud,
            profilePicUrlSanitized: this.getSanitizedUrl(this.usuario.profilePic, this.usuario.profilePicContentType),
            profilePicContentType: this.usuario.profilePicContentType,
            id: this.usuario.id
          };
        }
      } else {
        this.relacionService
          .findByUsuario(this.usuarioVisitor.usuario).subscribe((responseVisitor: HttpResponse<Array<IRelacion>>) => {
          const rel2: IRelacion =
            responseVisitor.body.filter((relacion: IRelacion) => relacion.amigoId === this.usuario.id)[0];

          if (rel2) {
            if (rel2.amigoId === this.usuario.id && rel2.estado === false) {
              this.sonAmigos = false;
              this.usuarioVisitedEnvioSolicitud = false;
              this.usuarioVisitorEnvioSolicitud = true;
              this.cargandoEstadoRelacion = false;

              this.perfilVistado = {
                firstNameLastName:
                  this.usuario.primerNombre +
                  "" +
                  this.usuario.segundoNombre +
                  "" +
                  this.usuario.primerApellido +
                  "" +
                  this.usuario.segundoApellido,
                firstNameLastNameSpaced:
                  this.usuario.primerNombre +
                  " " +
                  this.usuario.segundoNombre +
                  " " +
                  this.usuario.primerApellido +
                  " " +
                  this.usuario.segundoApellido,
                usuario: this.usuario.usuario,
                amigos: this.sonAmigos,
                envioSolicitud: this.usuarioVisitedEnvioSolicitud,
                envieSolicitud: this.usuarioVisitorEnvioSolicitud,
                profilePicUrlSanitized:
                  this.getSanitizedUrl(this.usuario.profilePic, this.usuario.profilePicContentType),
                profilePicContentType: this.usuario.profilePicContentType,
                id: this.usuario.id
              };
            }
          } else {
            this.sonAmigos = false;
            this.usuarioVisitedEnvioSolicitud = false;
            this.usuarioVisitorEnvioSolicitud = false;
            this.cargandoEstadoRelacion = false;

            this.perfilVistado = {
              firstNameLastName:
                this.usuario.primerNombre +
                "" +
                this.usuario.segundoNombre +
                "" +
                this.usuario.primerApellido +
                "" +
                this.usuario.segundoApellido,
              firstNameLastNameSpaced:
                this.usuario.primerNombre +
                " " +
                this.usuario.segundoNombre +
                " " +
                this.usuario.primerApellido +
                " " +
                this.usuario.segundoApellido,
              usuario: this.usuario.usuario,
              amigos: this.sonAmigos,
              envioSolicitud: this.usuarioVisitedEnvioSolicitud,
              envieSolicitud: this.usuarioVisitorEnvioSolicitud,
              profilePicUrlSanitized: this.getSanitizedUrl(this.usuario.profilePic, this.usuario.profilePicContentType),
              profilePicContentType: this.usuario.profilePicContentType,
              id: this.usuario.id
            };
          }
        });
      }

      this.spinnerFlag = true;
      this.relacionService.findSolicitudesRecibidasByUsuario(this.usuario.id)
        .subscribe((response: HttpResponse<Array<IRelacion>>) => {
        // obtener amigo del usuario
          this.amigos =
            response.body.filter((relacion: IRelacion) => relacion.estado === true).map((relacion: IRelacion) => {

            relacion.usuario.profilePic =
              this.getSanitizedUrl(relacion.usuario.profilePic, relacion.usuario.profilePicContentType);

            return relacion.usuario;
          });

          this.spinnerFlag = false;
          this.myItems.push(...this.amigos);
        }, () => {
          this.spinnerFlag = false;
        }, () => {
          this.spinnerFlag = false;
        });

      // this.relaciones contiene las solicitudes enviadas, es decir, aquellas relaciones(registro) con estado = false
      // y tambien contiene aquellas relaciones(registro) donde define que el usuario es amigo de otro
      // es decir, donde el estado es = true

      this.spinnerFlag = false;

      this.getCantAmigos();
    }, (error) => {
      this.spinnerFlag = false;
    }, () => {
      this.spinnerFlag = false;
    });

    this.postService.findAllPostsByUsuario(this.usuario.usuario).subscribe((res: HttpResponse<Array<IPost>>) => {
      this.postUsuario = res.body;

      this.getCantPosts();
    });

    this.postService.findAllLikesPostUsuarioByUsuario(this.usuario.id).subscribe((res: HttpResponse<Array<IPost>>) => {
      this.postLikesUsuario = res.body;
      this.getCantLikes();
    });

    this.activityIndicator = true;

    this.postService
      .findPostWallByUsuarioIdPageableVisitedProfile(this.usuario.id, this.scrollPage, 4)
      .subscribe((res: HttpResponse<Array<IPost>>) => {

        if (res.body) {
          res.body.filter((post: IPost) => post.usuario.usuario === this.usuario.usuario).map((post) => {
            const postImagesArray: Array<IImageFullPost> = [];
            const postFilesArray: Array<IFileFullPost> = [];

            post.filePosts
              .filter((file: IFilePost) =>
                file.fileContentType.substr(file.fileContentType.indexOf("image"), 5) === "image")
              .map((file) => {
                postImagesArray.push(new ImageFullPost(this.getSanitizedUrl(file.file, file.fileContentType)));
              });

            post.filePosts
              .filter((file: IFilePost) =>
                file.fileContentType.substr(file.fileContentType.indexOf("image"), 5) !== "image")
              .map((file) => {
                postFilesArray.push(new FileFullPost(file.file, file.fileContentType, "File"));
              });

            this.fullPosts.push({
              sourcePost: post,
              postImages: postImagesArray,
              filesPost: postFilesArray,
              fechaPublicacionPost: this.getFechaPublicacionPost(post),
              profilePicSanitized: this.getSanitizedUrl(post.usuario.profilePic, post.usuario.profilePicContentType)
            });

            this.activityIndicator = false;
            this.postsListView.nativeElement.resumeUpdates(true);

            if (this.fullPosts.length !== 0) {
              this.noHayPosts = false;
            }
          });

          if (res.body.length === 0) {
            this.noHayPosts = true;
            this.activityIndicator = false;
          }
        }

      }, (error) => {
        this.activityIndicator = false;
        this.noHayPosts = true;
      }, () => {
        this.activityIndicator = false;
        this.noHayPosts = true;
      });
  }

  enviarSolicitudBusqueda() {

    const usuarioIdRelacion: IUsuario = new Usuario(this.usuarioVisitor.id, this.usuarioVisitor.usuario);
    const relacionEnvioSolicitud: IRelacion =
      new Relacion(null, this.perfilVistado.id, false, moment(), usuarioIdRelacion);

    this.relacionService.create(relacionEnvioSolicitud).subscribe((relacionResponse: HttpResponse<IRelacion>) => {
      this.usuarioVisitorEnvioSolicitud = true;
      this.sonAmigos = false;
      this.usuarioVisitedEnvioSolicitud = false;

      this.relaciones.push(relacionResponse.body);
    });
  }

  aceptarSolicitudBusqueda(event) {

    const usuarioIdRelacion: IUsuario =
      new Usuario(this.usuarioVisitor.id, this.usuarioVisitor.usuario);
    const relacionAceptarSolicitud: IRelacion =
      new Relacion(null, this.perfilVistado.id, true, moment(), usuarioIdRelacion);

    this.relacionService.create(relacionAceptarSolicitud).subscribe((relacionResponse: HttpResponse<IRelacion>) => {
      this.sonAmigos = true;
      this.usuarioVisitedEnvioSolicitud = false;
      this.usuarioVisitorEnvioSolicitud = false;

      this.relaciones.push(relacionResponse.body);

      this.amigos.push(relacionResponse.body.usuario);
      this.myItems.push(relacionResponse.body.usuario);

      this.cantAmigos++;
    });
  }

  deleteLike(post: IFullPost) {
    this.loadingLikeFlag = true;

    const idLike: number = post.sourcePost.likes.filter((like) => like.usuarioLike.id === this.usuarioVisitor.id)[0].id;

    post.sourcePost.likes =
      post.sourcePost.likes
        .filter((like) => like.usuarioLike.id !== this.usuarioVisitor.id).map((like) => like);

    this.likeService.delete(idLike).subscribe(
      (res: HttpResponse<any>) => {

        this.loadingLikeFlag = false;

        if (post.sourcePost.usuario.id === this.usuarioVisitor.id) {
          this.cantLikes--;
        }
      },
      (res: HttpErrorResponse) => {
        this.loadingLikeFlag = false;
        console.log(res.message);
      }
    );
  }

  onPullToRefreshInitiated(args: ListViewEventData) {
    this.scrollPage = 0;

    setTimeout(() => {
      this.postService
        .findPostWallByUsuarioIdPageableVisitedProfile(this.usuario.id, this.scrollPage, 4)
        .subscribe((res: HttpResponse<Array<IPost>>) => {

          if (res.body) {
            this.fullPosts.length = 0;
            this._sourceDataItems.length = 0;

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

                this.fullPosts.push({
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
          }

        });
    }, 1000);
  }

  onLoadMoreItemsRequested(args: LoadOnDemandListViewEventData) {
    const that = new WeakRef(this);
    const listView: RadListView = args.object;
    if (this._sourceDataItems.length > 0) {

      setTimeout(() => {
        that.get().addMoreItemsFromSource(2);
        listView.notifyLoadOnDemandFinished();
      }, 500);

    } else {

      this.scrollPage++;

      this.postService
        .findPostWallByUsuarioIdPageableVisitedProfile(this.usuario.id, this.scrollPage, 4)
        .subscribe((res: HttpResponse<Array<IPost>>) => {
          if (res.body) {
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

              this._sourceDataItems.push({
                sourcePost: post,
                postImages: postImagesArray,
                filesPost: postFilesArray,
                fechaPublicacionPost: this.getFechaPublicacionPost(post),
                profilePicSanitized: this.getSanitizedUrl(post.usuario.profilePic, post.usuario.profilePicContentType)
              });

              setTimeout(() => {
                that.get().addMoreItemsFromSource(2);
                listView.notifyLoadOnDemandFinished(true);
              }, 500);

            });
          } else {
            args.returnValue = false;
            listView.notifyLoadOnDemandFinished(true);
          }
        }, () => {
          args.returnValue = false;
          listView.notifyLoadOnDemandFinished(true);
        }, () => {
          args.returnValue = false;
          listView.notifyLoadOnDemandFinished(true);
      });
    }
  }

  addMoreItemsFromSource(chunkSize: number) {
    const newItems = this._sourceDataItems.splice(0, chunkSize);
    this.fullPosts.push(newItems);
  }

  validateLike(postLikes: Array<ILike>): boolean {

    if (postLikes) {
      if (postLikes.filter((like) => like.usuarioLike !== null)
        .filter((like) => like.usuarioLike.id === this.usuarioVisitor.id)[0]) {
        return false;
      }
    }

    return true;
  }

  getCantAmigos() {
    this.cantAmigos = this.relaciones.filter((relacion) => {
      return relacion.estado === true;
    }).length;
  }

  getUsuario() {

    // this.fullPosts = new ObservableArray<IFullPost>([]);

    // esto se hace para que al enviar el usuario no se envie un
    // arreglo vacio de actividades sino que vaya el valor sin definirse

    if (typeof this.usuario.actividads !== "undefined" && this.usuario.actividads !== null) {
      if (this.usuario.actividads.length === 0) {
        this.usuario.actividads = null;
      }
    }

    // this.picUrl = this.getSanitizedUrl(this.usuario.profilePic, this.usuario.profilePicContentType);

    this.loadAll();

  }

  getFechaPublicacionPost(post: IPost): string {
    return post.fechaPublicacion.calendar();
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

  getCantLikes() {
    if (this.postLikesUsuario) {
      this.postLikesUsuario.map((post) => {
        this.cantLikes += post.likes.length;
      });
    } else {
      this.cantLikes = 0;
    }
  }

  setLike(post: IFullPost) {

    this.loadingLikeFlag = true;

    // tslint:disable-next-line
    const v_post: IPost = new Post(post.sourcePost.id,
      post.sourcePost.texto,
      post.sourcePost.url,
      post.sourcePost.fechaPublicacion);

    const usuarioDaLike: IUsuario = new Usuario(
      this.usuarioVisitor.id,
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

  goBack() {
    this.routerExtensions.back();
  }

  getCantPosts() {
    if (this.postUsuario) {
      this.cantPosts = this.postUsuario.length;
    }
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
    sideDrawer.showDrawer();
  }

  private subscribeToSaveResponse(result: Observable<HttpResponse<ILike>>, post: IPost) {
    result.subscribe(
      (res: HttpResponse<ILike>) => {
        // console.log('se creo like');
        post.likes.push(res.body);
        this.loadingLikeFlag = false;

        if (post.usuario.id === this.usuario.id) {
          this.cantLikes++;
        }
      },
      (res: HttpErrorResponse) => {
        this.loadingLikeFlag = false;
        console.log("no se creo like");
      }
    );
  }

}
