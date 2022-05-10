const express = require("express");
const app = express();
const dblib = require("./dblib.js");
const path = require("path");
const multer = require("multer");
const upload = multer();
const { Pool } = require("pg");
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static("public"));


app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});



app.use(express.static("public"));

app.listen(process.env.PORT || 3000, () => {
    console.log("Server started (http://localhost:3000/) !");
});

app.get("/", (req, res) => {
    res.render("index");
});


// get manage
app.get("/manage", async (req, res) => {
    const totRecs = await dblib.getTotalRecords();
    const customer = {
        cusid: "",
        cusfname: "",
        cuslname: "",
        cusstate: "",
        cussalesytd: "",
        cussalesprev: ""
    };
    res.render("manage", {
        type: "get",
        totRecs: totRecs.totRecords,
        customer: customer
    });
});

//post manage 
app.post("/manage", async (req, res) => {
    const totRecs = await dblib.getTotalRecords();
    dblib.findCustomer(req.body)
        .then(result => {
            res.render("manage", {
                type: "post",
                totRecs: totRecs.totRecords,
                result: result,
                customer: req.body
            })
        })
        .catch(err => {
            res.render("manage", {
                type: "post",
                totRecs: totRecs.totRecords,
                result: `Unexpected Error: ${err.message}`,
                customer: req.body
            });
        });
});


//get create
app.get("/create", async (req, res) => {
    const totRecs = await dblib.getTotalRecords();
    const customer = {
        cusid: "",
        cusfname: "",
        cuslname: "",
        cusstate: "",
        cussalesytd: "",
        cussalesprev: ""
    };
    res.render("create", {
        type: "get",
        totRecs: totRecs.totRecords,
        customer: customer,
        model: customer
    });
});

//post create
app.post("/create", async (req, res) => {
    const sql = "INSERT INTO customer (cusid, cusfname, cuslname, cusstate, cussalesytd, cussalesprev) VALUES ($1, $2, $3, $4, $5, $6)";
    const customer = [req.body.cusid, req.body.cusfname, req.body.cuslname, req.body.cusstate, req.body.cussalesytd, req.body.cussalesprev];
    pool.query(sql, customer, err => {
        if (err) {
            return console.error(err.message);
        }
        res.redirect("/manage");
    });
});


// GET edit
app.get("/edit/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM customer WHERE cusid = $1";
    pool.query(sql, [id], (err, result) => {
        // if (err) ...
        res.render("edit", {
            type: "get",
            model: result.rows[0]
        });
    });
});

// POST edit
app.post("/edit/:id", async (req, res) => {
    const id = req.params.id;
    const customer = [req.body.cusfname, req.body.cuslname, req.body.cusstate, req.body.cussalesytd, req.body.cussalesprev, id];
    const sql = "UPDATE customer SET cusfname = $1, cuslname = $2, cusstate = $3, cussalesytd = $4, cussalesprev = $5 WHERE (cusid = $6)";
    pool.query(sql, customer, (err, result) => {
        if (err) {
            return console.error(err.message);
        }
        res.redirect("/manage");
    });
});

// GET delete
app.get("/delete/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM customer WHERE cusid = $1";
    pool.query(sql, [id], (err, result) => {
        if (err) {
            return console.error(err, message);
        }
        // console.log(result.row[0]);
        res.render("delete", {
            model: result.rows[0],
            type: "get"
        });
    });
});

// POST delete
app.post("/delete/:id", async (req, res) => {
    const id = req.params.id;
    const model = req.body;
    const sql = "DELETE FROM customer WHERE cusid = $1";
    try {
        const remove = await pool.query(sql, [id]);
        res.render("delete", {
            model: model,
            remove: remove.rowCount,
            type: "POST"
        });

    } catch (err) {
        res.render("delete", {
            model: model,
            remove: err.message,
            type: "POST"
        });
        console.log(err.message);
    }
    console.log("This is a test", remove);
});

//get import
app.get("/import", async (req, res) => {
    const totRecs = await dblib.getTotalRecords();
    const customer = {
        cusid: "",
        cusfname: "",
        cuslname: "",
        cusstate: "",
        cussalesytd: "",
        cussalesprev: ""
    };
    res.render("import", {
        type: "get",
        totRecs: totRecs.totRecords,
        customer: customer
    });
});
// post import
app.post("/import", upload.single('filename'), (req, res) => {
    if (!req.file || Object.keys(req.file).length === 0) {
        message = "Error: Import file not uploaded";
        return res.send(message);
    };
    const buffer = req.file.buffer;
    const lines = buffer.toString().split(/\r?\n/);

    lines.forEach(line => {
        customer = line.split(",");
        const sql = "INSERT INTO CUSTOMER(cusid, cusfname, cuslname, cusstate, cussalesytd, cussalesprev ) VALUES ($1, $2, $3, $4, $5, $6)";
        pool.query(sql, customer, (err, result) => {
            if (err) {
                console.log(`Insert Error.  Error message: ${err.message}`);
            } else {
                console.log(`Inserted successfully`);
            }
        });
    });
    message = `Processing Complete - Processed ${lines.length} records`;
    res.send(message);
});

//get Export
app.get("/export", async (req, res) => {
    var message = "";
    const totRecs = await dblib.getTotalRecords();
    const customer = {
        cusid: "",
        cusfname: "",
        cuslname: "",
        cusstate: "",
        cussalesytd: "",
        cussalesprev: ""
    };
    res.render("export", {
        message: message,
        type: "get",
        totRecs: totRecs.totRecords,
        customer: customer
    });
});

// post export   
app.post("/export", (req, res) => {
    const sql = "SELECT * FROM customer ORDER BY cusid";
    pool.query(sql, [], (err, result) => {
        var message = "";
        if (err) {
            message = `Error - ${err.message}`;
            res.render("export", { message: message })
        } else {
            var output = "";
            result.rows.forEach(customer => {
                output += `${customer.cusid},${customer.cusfname},${customer.cuslname},${customer.cusstate},${customer.cussalesytd},${customer.cussalesprev},\r\n`;
            });
            res.header("Content-Type", "text/csv");
            res.attachment("export.txt");
            return res.send(output);
        };
    });
});

//get report
app.get("/reports", async (req, res) => {
    const reports = req.body.value;
    res.render("reports", {
        type: "get",
        model: reports,
        obc: "",
        obs: "",
        obr: ""
    });
});

//post report
app.post("/reports", async (req, res) => {
    var report;
    var trans;
    var c;
    var s;
    var r;
const model = req.body;
    try {
        if (req.body.reports === "1") {
            const custSort = await dblib.scust();
            report = custSort.obl
            trans = custSort.trans;
            c = "selected";

        }
        else if (req.body.reports === "2") {
            const salSort = await dblib.ssales();
            if (salSort.trans === "success") {
                report = salSort.obs;
                trans = salSort.trans;
                s = "selected";
            }
            else {
                report = salSort.msg;
                trans = salSort.trans;
                r = "selected"
            }
        }
        else {
            const ranCus = await dblib.random();
            report = ranCus.obr;
            trans = ranCus.trans;
            r = "selected"
        }
        res.render("reports", {
            type: "post",
            report: report,
            trans: trans,
            model: model,
            value: req.body.reports,
            obc: c,
            obs: s,
            obr: r
        });
    } catch (err) {
        res.render("reports", {
            type: "post",
            trans: "fail",
            report: err.message,
            model: model,
            value: req.body.reports

        });
    }
});
