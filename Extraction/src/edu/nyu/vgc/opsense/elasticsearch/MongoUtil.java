package edu.nyu.vgc.opsense.elasticsearch;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.io.StringReader;
import java.net.UnknownHostException;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.json.Json;
import javax.json.JsonObject;
import javax.json.JsonReader;
import javax.json.JsonWriter;
import javax.json.JsonWriterFactory;
import javax.json.stream.JsonGenerator;

import org.apache.commons.lang3.time.StopWatch;

import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBObject;
import com.mongodb.MongoClient;

public class MongoUtil {
	public static void main(String[] args){
		MongoUtil mongo = new MongoUtil();
		mongo.getDataToProcess();
	}
	
	private MongoClient client;
	public MongoClient client(){
		if(client == null)
			try {
				client = new MongoClient();
			} catch (UnknownHostException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		return client;
	}
	
	
	public DB getDB(String dbname){
		return client().getDB(dbname);
	}
	
	public JsonObject getJSON(DBObject obj){
		JsonReader jsonReader = Json.createReader(new StringReader(obj.toString()));
		JsonObject object = jsonReader.readObject();
		jsonReader.close();
		return object;
	}
	
	public void printJson(DBObject obj){
		JsonObject jobj = getJSON(obj);
		Map<String, Object> properties = new HashMap<>(1);
        properties.put(JsonGenerator.PRETTY_PRINTING, true);
        JsonWriterFactory writerFactory = Json.createWriterFactory(properties);
        JsonWriter jsonWriter = writerFactory.createWriter(System.out);
        jsonWriter.writeObject(jobj);
        
	}
	
	public void getDataToProcess(){
		String output = "/Volumes/Backup/Datasets/processText/zocDoc_raw.json";
		
		DB db = getDB("ZocDoc");
        DBCollection entityCollection = db.getCollection("doctors_copy");
        //DBCollection authorCollection = db.getCollection("_user");
        //DBCollection textCollection = db.getCollection("_review");
        //String authorID = "user_id";
        String entityID = "Id";
        String textID = "review_id";
        
        //String[] rmAuthor = {};
        String[] rmEntity = {"Comment","MainSpecialtyId", "ProviderId", "LocationId", 
        		"Rating", "Address1", "Address2", "Count", "Processed", "ProfId", "_id", "Reviews" };
        String[] rmText = {"Author"};
        
        //String[] countAuthor = {};
        String[] countEntity = {};
        String[] countText = {};
        
        //Get Business
        int total = entityCollection.find().count();
        int limit = total;
        //limit = 4;
        int count[] = new int[1];
        count[0] = 1;
        StopWatch timer = new StopWatch();
		timer.start();
		entityCollection.find().limit(limit).forEach(e ->{
			//Get Reviews of business
			System.out.println(
					String.format("%10s", count[0]++) +
					String.format("%10s", total) +
					String.format("%30s", e.get(entityID)) +
					String.format("%20s", timer.getTime()) +
					String.format("%20s", timer.getTime()/count[0]) 
					
			);
			int countE = ((BasicDBList)e.get("Reviews")).size();
			if(countE > 0){
				e.put("docCount", countE);
				int countReview[] = new int[1];
				countReview[0] = 1;
				((BasicDBList)e.get("Reviews")).forEach(t -> {
					//Get the users of reviews
					//DBObject a = authorCollection.findOne(new BasicDBObject(authorID, t.get(authorID)));
					//int countA = textCollection.find(new BasicDBObject(authorID, t.get(authorID))).count();
					//a.put("docCount", countA);
					
					//Clear
					DBObject e1 = clear(e, rmEntity, countEntity, entityID, true);
					
					DBObject a = new BasicDBObject();
					a.put("Name", ((DBObject)t).get("Author"));
					a.put("id", ((DBObject)t).get("Author"));
					//clear(a, rmAuthor, countAuthor, authorID);
					
					clear((DBObject)t, rmText, countText, textID);
					((DBObject)t).put("id", e.get(entityID).toString() + "_" + countReview[0]++);
					((DBObject)t).put("When", fixDate("MMM dd, yyyy", ((DBObject)t).get("When").toString()));
					
					BasicDBObject result = new BasicDBObject();
					result.put("entity", e1);
					result.put("author", a);
					result.put("document", t);
					//printJson(result);
					writeToFile(output, result);
				});
			}
		});
		//Save to file		
	}
	
	public String fixDate(String format, String sDate){
		Date dateD = null;
		DateFormat df = new SimpleDateFormat(format);
		DateFormat dof = new SimpleDateFormat("yyy-MM-dd");
		
		try {
			dateD = df.parse(sDate);
		} catch (Exception e) {
			//e.printStackTrace();
			return null;
		}
		
		return dof.format(dateD);
	}
	
	public void writeToFile(String file, DBObject obj){
		try(PrintWriter out = new PrintWriter(new BufferedWriter(new FileWriter(file, true)))) {
			out.println(obj.toString());
		} catch (Exception ex){
			ex.printStackTrace();
		}
	}
	
	public DBObject clear(DBObject obj,String[] rm , String[] count, String idField, boolean copy){
		if(copy)
			obj = new BasicDBObject(obj.toMap());
		for(String f : rm){
			String[] fs = f.split("\\.");
			DBObject obj2 = obj;
			for(int i =0; i < fs.length-1; i++){
				obj2 = (DBObject) obj2.get(fs[i]);
			}
			obj2.removeField(fs[fs.length-1]);
			
		}
		for(String f : count){
			BasicDBList lis = (BasicDBList) obj.get(f);
			obj.put(f, lis.size());
		}
		Object id = obj.get(idField);
		obj.removeField(idField);
		obj.put("id", id);
		return obj;
		
	}
	
	public DBObject clear(DBObject obj,String[] rm , String[] count, String idField){
		return clear(obj,rm,count,idField,false);
		
	}
}



























