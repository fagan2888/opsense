package edu.nyu.vgc.mongo;

import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.MongoClient;

import java.net.UnknownHostException;
import java.util.logging.Level;
import java.util.logging.Logger;


public class $db {
    public MongoClient mongoClient;
    public DB db;
    
    
    public $db(String server, int port, String db) {
		try {
			this.mongoClient = new MongoClient(server,port);
			this.db = this.mongoClient.getDB(db);
					
		} catch (UnknownHostException e) {
			e.printStackTrace();
		}
	}

	public DBCollection coll(String c){
        return db().getCollection(c);
    }
    
    public DB db(){
        if(db ==  null){
            db = client().getDB("Yelp");
        }
        return db;
    }
    
    public void use(String base){
        db = client().getDB(base);
    }
    
    public MongoClient client(){
        if(mongoClient == null)
            try {
                mongoClient =  new MongoClient();
        } catch (UnknownHostException ex) {
            Logger.getLogger($db.class.getName()).log(Level.SEVERE, null, ex);
        }
        return mongoClient;
    }
    
    
    
}
