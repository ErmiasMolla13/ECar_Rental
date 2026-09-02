import pool from "@/app/libs/mysql";
import { NextResponse } from "next/server";

export async function GET(request) {
    let db;
    try {
        const searchParams = request.nextUrl.searchParams;
        const admin_name = searchParams.get("admin_name");
        const adrress = searchParams.get("adrress");
        const admin_id = searchParams.get("admin_id");

        db = await pool.getConnection();
        
        let query;
        let params = [];
        
        if(admin_id && admin_name && adrress){
            query = "SELECT * FROM admin WHERE admin_id=? AND admin_name=? AND adrress=?";
            params = [admin_id, admin_name, adrress];
        } else if (admin_id && admin_name){
            query = "SELECT * FROM admin WHERE admin_id=? AND admin_name=?";
            params = [admin_id, admin_name];
        } else if(admin_id && adrress){
            query = "SELECT * FROM admin WHERE admin_id=? AND adrress=?";
            params = [admin_id, adrress];
        } else if(admin_name && adrress){
            query = "SELECT * FROM admin WHERE admin_name=? AND adrress=?";
            params = [admin_name, adrress];
        } else if (admin_id) {
            query = "SELECT * FROM admin WHERE admin_id=?";
            params = [admin_id];
        } 
        else if (admin_name) {
            query = "SELECT * FROM admin WHERE admin_name=?";
            params = [admin_name];
        }
        else if (adrress) {
            query = "SELECT * FROM admin WHERE adrress=?";
            params = [adrress];
        } else if (admin_id) {
            query = "SELECT * FROM admin WHERE admin_id=?";
            params = [admin_id];
        }else {
            query = "SELECT * FROM admin";
        }

        const [rows] = await db.execute(query, params);
        return NextResponse.json(rows);
        
    } catch (error) {
        console.error("Database Error:", error);
        return NextResponse.json({
            error: "Internal server error"
        },
        {status:500});
    } finally {
        if (db) db.release();
    }
}


//Post

export async function POST(request){
    let db;
    try {

        const incoming_data = await request.json();
        db = await pool.getConnection();
        
        const checkQuery = `SELECT * FROM admin where username = ?`;
        const [existingUser] = await db.execute(checkQuery, [incoming_data.username]);

        if(existingUser.length > 0){
            return NextResponse.json(
                {
                    error : "User Name Already Exists"
                },
                {status: 400}
            );
        }
        
        const query = `INSERT INTO admin(admin_name, contact, adrress, username, paassword) VALUES (?,?,?,?,?)` ;
        const params = [
           incoming_data.admin_name,incoming_data.contact,
           incoming_data.adrress,
           incoming_data.username,incoming_data.paassword
        ];

        const [rows] = await db.execute(query, params);
        return NextResponse.json(rows);

    } catch (error) {
       return NextResponse.json({
        error:error
       },
    {status: 500}) 
    }finally {
       if (db) db.release();
    }

}


//PUT


export async function PUT(request){
    let db;

    try {
        const incoming_data= await request.json();
        db = await pool.getConnection();

        const checkQuery = `SELECT * FROM admin where username = ?`;
        const [existingUser] = await db.execute(checkQuery, [incoming_data.username]);

        if(existingUser.length === 0){
            return NextResponse.json(
                {
                    error : "UserName does Not Exists"
                },
                {status: 404}
            );
        }

        const updateQuery = `UPDATE admin SET 
            admin_name=?,
            contact=?,
            adrress=?,
            username=?,
            paassword=?
            WHERE username=?`;

        const params = [
            incoming_data.admin_name,
            incoming_data.contact,
            incoming_data.adrress,
            incoming_data.user_name,
            incoming_data.paassword, 
            incoming_data.username
        ];

        const [rows] = await db.execute(updateQuery, params);
        
       
        return NextResponse.json({
            message: "Admin updated successfully",
        });
    
    } catch (error) {
       
        return NextResponse.json(
            { 
                error: "Internal server error",
                details: error.message 
            },
            { status: 500 }
        );
    } finally {
        
        if (db) db.release();
    }
}

export async function DELETE(request){
   let db;

   try {
    const incoming_data = await request.json();
    db = await pool.getConnection();

    const checkQuery = `SELECT *FROM admin WHERE username=?`;

const [existingUser] = await db.execute(checkQuery,[incoming_data.username]);

    if(existingUser.length === 0){
        return NextResponse.json (
        {error:"Username Does Not Exist"},
            {status: 404}
        )
    }

    const deleteQuery = `DELETE FROM admin WHERE username=?`;

    const [rows] = await db.execute(deleteQuery,[incoming_data.username]);

    return NextResponse.json({message: "Admin deleted succusfully",
    affectedRows: rows.affectedRows   
    } );

   } catch (error) {
     return NextResponse.json({
        error:"Error",
        details: error.message
     })
   }finally {
    if (db) db.release();
   }
}