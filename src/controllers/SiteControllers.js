const Company = require("../models/company");
const Account = require("../models/account");
const Comment = require("../models/comment");
class SiteControllers {
  // [GET] /
  home(req, res, next) {
    Company.find({})
      .lean()
      .skip(0)
      .limit(10)
      .then((company) => {
        company.forEach((e) => {
          e.totalLike = e.like.length-1
          if(e.totalLike <= 0) {
            e.totalLike = 0
          }
        })

        res.render("home", {
          company,
        });
      })
      .catch(next);
  }

  // [GET] /home/companies
  homeCompanies(req, res, next) {
    var page = req.query.page;
    if (!req.query.page) {
      page = 1;
    }
    const size = 8;
    const limit = size;
    const skip = (page - 1) * size;

    Promise.all([
      Company.count({}),
      Company.find({}).lean().skip(skip).limit(limit),
    ])
    .then(([total, company]) => {
      var totalPage = Math.ceil(total / size);
      var arrtotalPage = [];
      for (var i = 1; i < totalPage + 1; i++) {
        arrtotalPage.push(i);
      }

      company.forEach((e) => {
        e.totalLike = e.like.length-1
        if(e.totalLike <= 0) {
          e.totalLike = 0
        }
      })

      res.render("homeCompanies", {
        company,
        total,
        arrtotalPage,
      });
    });
  }

  // [GET] /rank
  rankCompanies(req, res, next) {
    Company.find({})
      .lean()
      .limit(10)
      .sort({ like: "desc" })
      .then((company) => {
        res.render("rank", {
          company,
        });
      });
  }

  // [GET] /login
  login(req, res, next) {
    res.render("login", { layout: false });
  }

  // [post] /login
  postLogin(req, res, next) {
    Account.findOne({ email: req.body.email })
      .lean()
      .then((user) => {
        if (!user) {
          res.render("login", {
            err: "Tài khoản này không tồn tại",
            layout: false,
          });
          return;
        }
        if (user.password != req.body.password) {
          res.render("login", { err: "Mật Khẩu Không Đúng", layout: false });
          return;
        }
        res.cookie("userId ", user._id);
        res.redirect("/");
      });
  }

  // [GET] /register
  register(req, res, next) {
    res.render("register", { layout: false })
  }

  // [GET] /contact
  contact(req, res, next) {
    res.render("contact");
  }

  

  // [PUT] /profile/update/:slug
  updateProfile(req, res, next) {
    const file = req.file;
    // Kiểm tra nếu không phải dạng file thì báo lỗi
    if (!file) {
        const error = new Error('Upload file again!')
        error.httpStatusCode = 400
        return next(error)
      }
    // file đã được lưu vào thư mục uploads
    // gọi tên file: req.file.filename và render ra màn hìnhe
      const  accountUpdate={
        avatar: req.file.filename,
        ...req.body
      }

      Account.updateOne({ slug: req.params.slug }, accountUpdate)
      .then(() => res.redirect("back"))
      .catch(next);
  }

  // [post] /register
  postRegister(req, res, next) {
    var newAccount = new Account(req.body);
    newAccount.save().then(() => {
      res.redirect("/login");
    });
  }

  // [post] /like/company/:slug
  likeCompany(req, res, next) {
    Company.findOneAndUpdate({ _id: req.params.id }, {
      $addToSet: {like: req.query.idUser}
    })
    .then(() => {
      res.redirect("back");
    });
  }


  // [GET] /profile/:slug
  profile(req, res, next) {
    Account.findOne({slug: req.params.slug})
      .then(async (user) => {
        var avatar = user.avatar 
        var userName = user.userName
        var slug = user.slug
        res.render("profile", { avatar, userName, slug});
      })
  }

  //[get] /logout
  logout(req, res, next) {
    res.clearCookie("userId");
    res.clearCookie("companyId");
    res.redirect("/");
  }

  // [GET] /detail/:slug
  detail(req, res, next) {
    Company.findOne({ slug: req.params.slug })
      .lean()
      .then((company) => {
        res.cookie("idCompany", company._id);
        return company;
      })
      .then((company) => {
        var idUser = req.cookies.userId;
        var img1 = company.albums[0].filename;
        var img2 = company.albums[1].filename;
        var img3 = company.albums[2].filename;
        var fillterComment = [];
        var massage = Comment.find({ idCompany: company._id })
          .lean()
          .sort({ createdAt: -1 });
        var countComment = Comment.find({ idCompany: company._id }).count({});
        var user = Account.find({}).lean();
        Promise.all([massage, user, countComment])
        .then(
          ([massage, user, countComment]) => {
            massage.map((massageCurrent) => {
              user.find((useCurrent) => {
                if (massageCurrent.idUser == useCurrent._id) {
                  var infoMass = Object.assign(massageCurrent, useCurrent);
                  fillterComment.push(infoMass);
                }
              });
            });

            fillterComment.forEach((e) => {
              var time = `${e.createdAt.getHours()}h/${e.createdAt.getDay()}/${e.createdAt.getMonth()}/${e.createdAt.getFullYear()}` 
              e.createdAt = time
            })

            // console.log(fillterComment)
            
            var totalLike = company.like.length-1
        if(totalLike <= 0) {
          totalLike = 0
        }

            res.render("detail", {
              company,
              totalLike,
              idUser,
              img1,
              img2,
              img3,
              fillterComment,
              countComment,
            });
          }
        );
        if (!req.cookies.idCompany) {
          res.render("err", { layout: false });
        }
      })
      .catch(next)
  }

// [GET] /
  sortField(req, res, next) {
    var page = req.query.page;
    if (!req.query.page) {
      page = 1;
    }
    const size = 8;
    const limit = size;
    const skip = (page - 1) * size;

    Promise.all([
      Company.count({ field: req.params.field }),
      Company.find({ field: req.params.field }).lean().skip(skip).limit(limit),
    ]).then(([total, company]) => {
      var totalPage = Math.ceil(total / size);
      var arrtotalPage = [];
      for (var i = 1; i < totalPage + 1; i++) {
        arrtotalPage.push(i);
      }

      res.render("homeCompanies", {
        company,
        total,
        arrtotalPage,
      });
    });
  }

  search(req, res, next) {
    var page = req.query.page;
    if (!req.query.page) {
      page = 1;
    }
    const size = 8;
    const limit = size;
    const skip = (page - 1) * size;

    Promise.all([
      Company.count({ name: req.query.name.toUpperCase() }),
      Company.find({ name: req.query.name.toUpperCase() })
        .lean()
        .skip(skip)
        .limit(limit),
    ]).then(([total, company]) => {
      var totalPage = Math.ceil(total / size);
      var arrtotalPage = [];
      for (var i = 1; i < totalPage + 1; i++) {
        arrtotalPage.push(i);
      }
      res.render("homeCompanies", {
        company,
        total,
        arrtotalPage,
      });
    });
  }
  // Comment.find()
}

module.exports = new SiteControllers();
