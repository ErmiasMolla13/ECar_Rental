import pool from "@/app/libs/mysql";
import { NextResponse } from "next/server";


//post

export async function POST(request) {
  
    let db;
  
    try {
      
      const incoming_data = await request.json();
      db = await pool.getConnection();

    
    const sql =  `INSERT INTO crud(firstname, fathername, gfathername, description, fav_color) VALUES ("${incoming_data.firstname}","${incoming_data.fathername}","${incoming_data.gfathername}","${incoming_data.description}","${incoming_data.fav_color}")`
    const [rows] = await db.execute(sql)
    return NextResponse.json(rows);



    // const query = `INSERT INTO crud(firstname, fathername, gfathername, description, fav_color) VALUES (?,?,?,?,?)`;
  
    // //   const params = [
    // //     incoming_data.owner_name,
    // //     incoming_data.address,
    // //     incoming_data.contact,
    // //     incoming_data.admin_id,
    // //     incoming_data.email
    // //   ];
  
    // //   const [rows] = await db.execute(query, params);
    // //   return NextResponse.json(rows);


    } catch (error) {
      return NextResponse.json("DataBase Error")
    }finally{
      if (db) db.release();
    }
  }




  //GET
  export async function GET(request) {
    let db;
    try {
     
  
      db = await pool.getConnection();

      const sql = "SELECT * FROM crud";

      const [rows] = await db.execute(sql);
      
      return NextResponse.json(rows);




      //const searchParams = request.nextUrl.searchParams;
      //   const owner_name = searchParams.get("owner_name");
      //   const owner_id = searchParams.get("owner_id");
      //   const address = searchParams.get("address");
    //   let params = [];
  
    //   if (owner_id && owner_name && address) {
    //     query = "SELECT * FROM owner WHERE owner_id = ? AND owner_name = ? AND address=?";
    //     params = [owner_id, owner_name, address];
    //   } else if (owner_id && address) {
    //     query = "SELECT * FROM owner WHERE owner_id = ? AND address=?";
    //     params = [owner_id, address];
    //   } else if (owner_name && address) {
    //     query = "SELECT * FROM owner WHERE owner_name = ? AND address=?";
    //     params = [owner_name, address];
    //   }else if (owner_name) {
    //     query = "SELECT * FROM owner WHERE owner_name = ? ";
    //     params = [owner_name];
    //   }
    //   else if (address) {
    //     query = "SELECT * FROM owner WHERE address = ? ";
    //     params = [address];
    //   }
    //   else if (owner_id) {
    //     query = "SELECT * FROM owner WHERE owner_id = ? ";
    //     params = [owner_id];
    //   }else{
    //    query = "SELECT * FROM owner";
    //   }
  
    //   const [rows] = await db.execute(query, params);
      
    //   return NextResponse.json({ 
    //     rows: rows, 
  
    //   });
  
    } catch (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    } finally {
      if (db) db.release();
    }
  }
  


  //update Put

export async function PUT(request) {
  
    let db;
  
    try {
      
      const incoming_data = await request.json();
      db = await pool.getConnection();

      //check if the record is in the database
      const checkQuery = `SELECT * FROM crud WHERE id = ?`;
      const [existingdata] = await db.execute(checkQuery, [incoming_data.id]);
  
      if(existingdata.length > 0){
       
        const sql =  `UPDATE  crud SET firstname="${incoming_data.firstname}",fathername="${incoming_data.fathername}",gfathername="${incoming_data.gfathername}",description="${incoming_data.description}",fav_color="${incoming_data.fav_color}" WHERE id ="${incoming_data.id}" `

        const [rows] = await db.execute(sql)
       return NextResponse.json(rows);

     // return NextResponse.json({sql:sql});

      }
      else{
        return NextResponse.json({
            error: "Data not fouond"
          },
        {status : 400})
      }
    
   



    // const query = `INSERT INTO crud(firstname, fathername, gfathername, description, fav_color) VALUES (?,?,?,?,?)`;
  
    // //   const params = [
    // //     incoming_data.owner_name,
    // //     incoming_data.address,
    // //     incoming_data.contact,
    // //     incoming_data.admin_id,
    // //     incoming_data.email
    // //   ];
  
    // //   const [rows] = await db.execute(query, params);
    // //   return NextResponse.json(rows);


    } catch (error) {
      return NextResponse.json("DataBase Error")
    }finally{
      if (db) db.release();
    }
  }


  
export async function DELETE(request) {
    let db;
    

    try {
     const searchParams = request.nextUrl.searchParams;
     const id = searchParams.get("del_id");
     db = await pool.getConnection();
  
     const checkQuery = `SELECT * FROM crud WHERE id=?`;
  
  const [existingdata] = await db.execute(checkQuery,[id]);
  
     if(existingdata.length === 0){
         return NextResponse.json (
         {error:"Data not found"},
             {status: 404}
         )
     }
  
     const deleteQuery = `DELETE FROM crud WHERE id=?`;
  
     const [rows] = await db.execute(deleteQuery,[id]);
  
     return NextResponse.json({message: "Data  deleted succusfully",
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