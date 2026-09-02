import pool from "@/app/libs/mysql";
import { NextResponse } from "next/server";

export async function GET(request) {
    let db;

    try {
        
       const searchParams = request.nextUrl.searchParams;
       const car_type_id =  searchParams.get("car_type_id");
       const car_class = searchParams.get("car_class");

       db=await pool.getConnection();

       let query = "SELECT * FROM car_type";
       let params =[];

       if(car_type_id && car_class){
        query = "SELECT * FROM car_type WHERE car_type_id=? AND car_class=?";
        params = [car_type_id, car_class];
       }
       else if(car_type_id){
        query = "SELECT * FROM car_type WHERE car_type_id=?";
        params = [car_type_id];
       }
       else if(car_class){
        query = "SELECT * FROM car_type WHERE car_class=?";
        params = [car_class];
       }
       else{
        query = "SELECT * FROM car_type"
       }
       const [rows] = await db.execute(query, params);

       return NextResponse.json(rows);
    } catch (error) {
        error:error;
    }finally{
        if (db) db.release();
    }

    
}
