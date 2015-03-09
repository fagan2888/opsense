package edu.nyu.vgc.opsense.elasticsearch;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.io.StringReader;
import java.net.UnknownHostException;
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
		String output = "/Volumes/Backup/Datasets/processText/yelp_health_raw.json";
		
		DB db = getDB("Yelp");
        DBCollection entityCollection = db.getCollection("_business");
        DBCollection authorCollection = db.getCollection("_user");
        DBCollection textCollection = db.getCollection("_review");
        String authorID = "user_id";
        String entityID = "business_id";
        String textID = "review_id";
        
        String[] rmAuthor = {"_id","type"};
        String[] rmEntity = {"_id", "open", "type","review_count", "stars"};
        String[] rmText = {"_id", "user_id","type","business_id"};
        
        String[] countAuthor = {"friends"};
        String[] countEntity = {};
        String[] countText = {};
        
        //Get Business
        int total = entityCollection.find(new BasicDBObject("categories", "Health & Medical")).count();
        int limit = total;
        //limit = 10;
        int count[] = new int[1];
        count[0] = 1;
        StopWatch timer = new StopWatch();
		timer.start();
		entityCollection.find(new BasicDBObject("categories", "Health & Medical")).limit(limit).forEach(e ->{
			//Get Reviews of business
			System.out.println(
					String.format("%10s", count[0]++) +
					String.format("%30s", e.get(entityID)) +
					String.format("%20s", timer.getTime()) +
					String.format("%20s", timer.getTime()/count[0]) 
					
			);
			int countE = textCollection.find(new BasicDBObject(entityID, e.get(entityID))).count();
			e.put("docCount", countE);
			textCollection.find(new BasicDBObject(entityID, e.get(entityID))).forEach(t -> {
				//Get the users of reviews
				DBObject a = authorCollection.findOne(new BasicDBObject(authorID, t.get(authorID)));
				int countA = textCollection.find(new BasicDBObject(authorID, t.get(authorID))).count();
				a.put("docCount", countA);
				
				//Clear
				clear(e, rmEntity, countEntity, entityID);
				clear(a, rmAuthor, countAuthor, authorID);
				clear(t, rmText, countText, textID);
				
				BasicDBObject result = new BasicDBObject();
				result.put("entity", e);
				result.put("author", a);
				result.put("document", t);
				writeToFile(output, result);
			});
		});
		//Save to file		
	}
	
	public void writeToFile(String file, DBObject obj){
		try(PrintWriter out = new PrintWriter(new BufferedWriter(new FileWriter(file, true)))) {
			out.println(obj.toString());
		} catch (Exception ex){
			ex.printStackTrace();
		}
	}
	
	public void clear(DBObject obj,String[] rm , String[] count, String idField){
		for(String f : rm){
			obj.removeField(f);
		}
		for(String f : count){
			BasicDBList lis = (BasicDBList) obj.get(f);
			obj.put(f, lis.size());
		}
		Object id = obj.get(idField);
		obj.removeField(idField);
		obj.put("id", id);
		
	}
}



























