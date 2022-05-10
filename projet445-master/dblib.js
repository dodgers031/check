require("dotenv").config();
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const getTotalRecords = () => {
    sql = "SELECT COUNT(*) FROM customer";
    return pool.query(sql)
        .then(result => {
            return {
                msg: "success",
                totRecords: result.rows[0].count
            }
        })
        .catch(err => {
            return {
                msg: `Error ${err.message}`
            }
        });
};

const insertCustomer = (customer) => {
    if (customer instanceof Array) {
        params = customer;
    } else {
        params = Object.values(customer);
    };
    const sql = `INSERT INTO customer (cusid, cusfname, cuslname, cusstate, cussalesytd, cussalesprev)
                 VALUES ($1, $2, $3, $4, $5, $6)`;
    return pool.query(sql, params)
        .then(res => {
            return {
                trans: "success",
                msg: `customer id ${params[0]} successfully inserted`
            };
        })
        .catch(err => {
            return {
                trans: "fail",
                msg: `Error on insert of customer id ${params[0]}.  ${err.message}`
            };
        });
};

const scust = () => {
    const sql = "SELECT * FROM customer ORDER BY cuslname asc";
    return pool.query(sql) 
    .then(report => {
        return {
            trans:"success",
            obl: report.rows
        }
    })
    .catch(err => {
        return{
            trans: "fail",
            msg: `${err.message}`
        }
    });
};

const ssales = () => {
    const sql = "SELECT * FROM customer ORDER BY cussalesytd desc";
    return pool.query(sql)
    .then(report => {
        return {
            trans: "success",
            obs: report.rows
        }
    })
    .catch(err => {
        return{
            trans: "fail",
            msg: `${err.message}`
        }
    });
};

const random = () => {
    const sql = "SELECT * FROM customer ORDER BY RANDOM() LIMIT 3";
    return pool.query (sql)
    .then(report => {
        return {
            trans: "success",
            obr: report.rows
        }
    })
    .catch(err => {
        return{
            trans: "fail",
            msg: `${err.message}`
        }
    });
};

const findCustomer = (customer) => {

    var i = 1;
    params = [];
    sql = "SELECT * FROM customer WHERE true";

    // Check data provided and build query as necessary
    if (customer.cusid !== "") {
        params.push(parseInt(customer.cusid));
        sql += ` AND cusid = $${i}`;
        i++;
    };
    if (customer.cusfname !== "") {
        params.push(`${customer.cusfname}%`);
        sql += ` AND UPPER(cusfname) LIKE UPPER($${i})`;
        i++;
    };
    if (customer.cuslname !== "") {
        params.push(`${customer.cuslname}%`);
        sql += ` AND UPPER(cuslname) LIKE UPPER($${i})`;
        i++;
    };
    if (customer.cusstate !== "") {
        params.push(`${customer.cusstate}%`);
        sql += ` AND UPPER(cusstate) LIKE UPPER($${i})`;
        i++;
    };
    if (customer.cussalesytd !== "") {
        params.push(parseFloat(customer.cussalesytd));
        sql += ` AND cussalesytd >= $${i}`;
        i++;
    };
    if (customer.cussalesprev !== "") {
        params.push(parseFloat(customer.cussalesprev));
        sql += ` AND cussalesprev >= $${i}`;
        i++;
    };

    sql += ` ORDER BY cusid`;
    console.log("sql: " + sql);
    console.log("params: " + params);

    return pool.query(sql, params)
        .then(result => {
            return {
                trans: "success",
                result: result.rows
            }
        })
        .catch(err => {
            return {
                trans: "Error",
                result: `Error: ${err.message}`
            }
        });
};

module.exports.findCustomer = findCustomer;
module.exports.insertCustomer = insertCustomer;
module.exports.getTotalRecords = getTotalRecords;
module.exports.scust = scust;
module.exports.ssales = ssales;
module.exports.random = random;


