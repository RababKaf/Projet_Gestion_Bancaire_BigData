const exp = require("express");
const router = exp.Router();
const User = require('../models/users');
const multer = require('multer');
const users = require("../models/users");
const fs=require("fs");

// Image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + "_" + file.originalname);
    },
});

const upload = multer({
    storage: storage,
}).single("image");

// Insert user into database
router.post("/add", upload, async (req, res) => {
    try {
        const existingUser = await User.findOne({ CIN: req.body.CIN }).exec();

        if (existingUser) {
            req.session.message = {
                type: "danger",
                message: "Un utilisateur avec le même CIN existe déjà.",
            };
            return res.redirect('/');
        }
        const newAccount = {
            accountNumber: req.body.accountNumber,
            accountType: req.body.accountType,
            balance: req.body.balance
        };
        const user = new User({
            name: req.body.nomComplet,
            email: req.body.email,
            phone: req.body.phone,
            image: req.file.filename,
            CIN: req.body.CIN,
            bankAccounts: [newAccount]
        });
        await user.save();
        req.session.message = {
            type: "success",
            message: "L'utilisateur a été ajouté avec succès.",
        };
        res.redirect('/');
    } catch (error) {
        req.session.message = {
            type: "danger",
            message:" Erreur lors de l'ajout de l'utilisateur : ${error.message}",

        };
        res.redirect('/');
    }
});

router.get("/add", (req, res) => {
    res.render("add_users", { title: 'Ajouter Utilisateurs' });
});



router.get('/delete/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const user = await User.findByIdAndDelete(id);

        if (user && user.image !== '') {
            try {
                fs.unlinkSync('./uploads/' + user.image);
            } catch (err) {
                console.log(err);
            }
        }

        req.session.message = {
            type: 'success',
            message: 'Utilisateur a été supprimé avec succès'
        };
        res.redirect('/');
    } catch (err) {
        res.json({ message: err.message });
    }
});


router.get("/search", async (req, res) => {
    const accountType = req.query.accountType;

    try {
        const users = await User.aggregate([
            {
                $match: {
                    "bankAccounts.accountType": {
                        $regex: new RegExp(accountType, "i"),
                    },
                },
            },
        ]);

        res.render("index", {
            title: "Page Accueil",
            users: users,
            message: null,
        });
    } catch (err) {
        res.render("index", {
            title: "Page Accueil",
            users: [],
            message: { type: "danger", message: err.message },
        });
    }
});

router.get("/", async (req, res) => {
    try {
      


        // Fetch all users to display in the table
        const users = await User.find().exec();

        res.render("index", { title: 'Page Accueil', users: users});
    } catch (err) {
        res.json({ message: err.message, type: "danger" });
    }
});

//edit user

router.get('/edit/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);

        if (!user) {
            return res.redirect('/');
        }

        res.render('edit_users', {
            title: "Modifier utilisateur",
            user: user,
            bankAccounts: user.bankAccounts, // Envoi des informations des comptes bancaires à la vue
        });
    } catch (err) {
        res.redirect('/');
    }
});


  // Route pour ajouter un nouveau compte bancaire à l'utilisateur
  router.post('/addAccountt/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);
        if (!user) {
            return res.json({ message: "Utilisateur non trouvé", type: 'danger' });
        }
        // Vérifier le nombre de comptes actuels pour l'utilisateur
        if (user.bankAccounts.length >= 3) {
            return res.json({ message: "Nombre maximum de comptes atteint", type: 'danger' });
        }
        // Vérifier si le type de compte est déjà associé à l'utilisateur
        const existingAccount = user.bankAccounts.find(account => account.accountType === req.body.accountType);
        if (existingAccount) {
            return res.json({ message: "Ce type de compte existe déjà pour cet utilisateur", type: 'danger' });
        }
        // Ajouter un nouveau compte bancaire au tableau 'bankAccounts'
        if (req.body.accountNumber & req.body.accountType & req.body.balance) {
  
        user.bankAccounts.push({
            accountNumber: req.body.accountNumber,
            accountType: req.body.accountType,
            balance: req.body.balance
        });
    }
        await user.save();
        req.session.message = {
            type: 'success',
            message: 'Nouveau compte ajouté avec succès'
        };
        res.redirect("/");
    } catch (err) {
        res.json({ message: err.message, type: 'danger' });
    }
});


router.get('/addAccount/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id);

        if (!user) {
            return res.redirect('/');
        }

        res.render('add_accounts', {
            title: "Ajouter comptes",
            user: user,
            });
    } catch (err) {
        res.redirect('/');
    }
});


//update router 
router.post('/update/:id', upload, (req, res) => {
    let id = req.params.id;
    let new_image = '';
    if (req.file) {
        new_image = req.file.filename;
        try {
            fs.unlinkSync("./uploads/" + req.body.old_image);
        } catch (err) {
            console.log(err);
        }
    } else {
        new_image = req.body.old_image;
    }

    users.findById(id, (err, user) => {
        if (err) {
            res.json({ message: err.message, type: 'danger' });
        } else {
            // Mise à jour des champs utilisateur
            user.name = req.body.name;
            user.email = req.body.email;
            user.phone = req.body.phone;
            if (req.file) {
                user.image = new_image;
            }

            // Mise à jour des champs du compte bancaire
            if (user.bankAccounts && user.bankAccounts.length > 0) {
                user.bankAccounts.forEach((account, index) => {
                if (account && account.accountNumber && req.body.accountNumber && req.body.accountNumber[index]) {
                account.accountNumber = req.body.accountNumber[index];
                account.accountType = req.body.accountType[index];
                account.balance = req.body.balance[index];
                }
            });
        }
            // Sauvegarde des modifications
            user.save((err, updatedUser) => {
                if (err) {
                    res.json({ message: err.message, type: 'danger' });
                } else {
                    req.session.message = {
                        type: 'success',
                        message: 'Modification enregistrée avec succès'
                    };
                    res.redirect('/');
                }
            });
        }
    });
});








module.exports = router;