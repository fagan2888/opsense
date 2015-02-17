package edu.nyu.vgc.r2sense.scripts;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.sql.SQLException;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.sql.Date;
import java.util.LinkedList;
import java.util.Locale;
import java.net.URL;

import org.postgresql.util.PGobject;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.BasicDBList;
import com.mongodb.util.JSON;

import edu.nyu.vgc.SQL.ISQL;
import edu.nyu.vgc.SQL.Postgre;
import edu.nyu.vgc.mongo.*;
import edu.nyu.vgc.utils.$;


public class Scripts {
	public static void main(String args[]) throws SQLException{
		Scripts sc = new Scripts();
		RateMyProfessor rmp = sc.getRateMyProfessor();
		rmp.processProfessors();
	}
	
	public Scripts(){}
	//Crawler Rate my Professor --------------------------------------------------------------------------------------------------
	public RateMyProfessor getRateMyProfessor(){
		return new RateMyProfessor();
	}
	
	public class RateMyProfessor{
		String uniURL = "http://www.ratemyprofessors.com/find/school/?state=%s&page=%d&queryoption=SCHOOL&queryBy=schoolLocation";
		String profURL = "http://www.ratemyprofessors.com/find/professor/?page=%d&queryoption=TEACHER&sid=%d";
		String ratingURL = "http://www.ratemyprofessors.com/paginate/professors/ratings?tid=%d&page=%d";
		$db db = new $db("localhost",27017,"rateMyProfessor");
		
		public void processSchools(){
			LinkedList<Integer> ids = new LinkedList();
			
			db.coll("schools").find((DBObject)JSON.parse("{remaining: {$ne: 0}, numprofs: {$gt: 0}}")).forEach(school ->{
				Integer sid = Integer.parseInt(school.get("sid").toString());
				ids.push(sid);
				
			});
			ids.forEach(sid -> getProfessors(sid));
		}
		
		public void processProfessors(){
			LinkedList<Integer> ids = new LinkedList();
			
			db.coll("professors").find((DBObject)JSON.parse("{remaining: {$ne: 0}, tNumRatings: {$gt: 0}}")).forEach(professor ->{
				Integer tid = Integer.parseInt(professor.get("tid").toString());
				ids.push(tid);
				
			});
			ids.forEach(tid -> getRatings(tid));
		}
		
		public void getRatings(Integer tid){
			$.print("---------------------------------------------------------------------------------------------");
			$.print("Get ratings from: " + tid);
			Integer startPage = 1;
			Integer remaining;
			
			Integer page = startPage;
			DBObject professor = db.coll("professors").findOne((DBObject)JSON.parse("{tid:"+tid+"}"));
			
			
			try {
				do{
					
					InputStream input = new URL(String.format(ratingURL,tid,page)).openStream();
					Reader reader = new InputStreamReader(input, "UTF-8");
					String result = $.readerToString(reader);
					JsonParser parser = new JsonParser();
			        JsonObject data = parser.parse(result).getAsJsonObject();
			        
			        
			        JsonArray ratings = data.getAsJsonArray("ratings");
			        
			        if(data.get("remaining") != null)
			        	remaining = data.get("remaining").getAsInt();
			        else
			        	remaining = null;
			        
			        $.print(page + "-" + remaining);
			       
			        for(JsonElement rating: ratings){
			        	JsonObject ratingObj = rating.getAsJsonObject();
			        	ratingObj.addProperty("_id", ratingObj.get("id").getAsNumber());
			        	ratingObj.addProperty("tid", tid);
			        	db.coll("reviews").save((BasicDBObject)JSON.parse(ratingObj.toString()));
			        	//$.printJson(ratingObj);
			        }
			        
			        professor.put("lastPage", page);
			        professor.put("remaining", remaining);
			        db.coll("professors").save(professor);
			        
			        //$.printJson(school);
			        page++;
			        //remaining = null;
				} while (remaining!= null && remaining > 0);
				
			
			} catch (IOException e) {
				e.printStackTrace();
			} 	
			
		}
		
		
		
		public void getProfessors(Integer sid){
			$.print("---------------------------------------------------------------------------------------------");
			$.print("Get professors from: " + sid);
			Integer startPage = 1;
			Integer remaining;
			
			Integer page = startPage;
			DBObject school = db.coll("schools").findOne((DBObject)JSON.parse("{sid:"+sid+"}"));
			
			try {
				do{
					
					InputStream input = new URL(String.format(profURL, page,sid)).openStream();
					Reader reader = new InputStreamReader(input, "UTF-8");
					String result = $.readerToString(reader);
					JsonParser parser = new JsonParser();
			        JsonObject data = parser.parse(result).getAsJsonObject();
			        JsonArray professors = data.getAsJsonArray("professors");
			        
			        if(data.get("remaining") != null)
			        	remaining = data.get("remaining").getAsInt();
			        else
			        	remaining = null;
			        
			        $.print(page + "-" + remaining);
			        for(JsonElement professor: professors){
			        	JsonObject professorObj = professor.getAsJsonObject();
			        	professorObj.addProperty("_id", professorObj.get("tid").getAsNumber());
			        	db.coll("professors").save((BasicDBObject)JSON.parse(professorObj.toString()));
			        	//$.printJson(professorObj);
			        }
			        
			        school.put("lastPage", page);
			        school.put("remaining", remaining);
			        db.coll("schools").save(school);
			        
			        //$.printJson(school);
			        page++;
			        //remaining = null;
				} while (remaining!= null && remaining > 0);
				
				
			} catch (IOException e) {
				e.printStackTrace();
			} 	
		}
		
		public void getUniversities(String state){
			Integer startPage = 1;
			Integer remaining;

			Integer page = startPage;
			try {
				do{
					
					InputStream input = new URL(String.format(uniURL, state, page)).openStream();
					Reader reader = new InputStreamReader(input, "UTF-8");
					String result = $.readerToString(reader);
					JsonParser parser = new JsonParser();
			        JsonObject data = parser.parse(result).getAsJsonObject();
			        JsonArray schools = data.getAsJsonArray("schools");
			        
			        if(data.get("remaining") != null)
			        	remaining = data.get("remaining").getAsInt();
			        else
			        	remaining = null;
			        
			        $.print(page + "-" + remaining);
			        for(JsonElement school: schools){
			        	JsonObject schoolObj = school.getAsJsonObject();
			        	schoolObj.addProperty("_id", schoolObj.get("sid").getAsNumber());
			        	db.coll("schools").save((BasicDBObject)JSON.parse(schoolObj.toString()));
			        	//$.printJson(schoolObj);
			        }
			        page++;
				} while (remaining!= null && remaining > 0);
				
				
			} catch (IOException e) {
				e.printStackTrace();
			} 
		}
	}
	
	
	//Specifics ---------------------------------------------------------------------------------------------------------------
	public void copyReviewsToNew() throws SQLException{
			//Get current business
			$db mongo = new $db("localhost",27017,"yelp_restaurants");
			DBCollection reviews = mongo.coll("reviews");
			
			ISQL sql = new Postgre();
			sql.connect("jdbc:postgresql://localhost/r2sense", "postgres", "r2sense");
			String schema = "yelp_restaurants";
			
			DBCursor rCursor = reviews.find();
			rCursor.addOption(com.mongodb.Bytes.QUERYOPTION_NOTIMEOUT);
			rCursor.forEach(b -> {
				int res;
				try {
					
					PGobject info = new PGobject();
					info.setType("jsonb");
					info.setValue(b.get("votes" ).toString());

					DateFormat format = new SimpleDateFormat("yyyy-MM-dd", Locale.ENGLISH);
					Date date = new Date(format.parse(b.get("date").toString()).getTime());
					
					res = sql.insert(schema+ ".review", 
							new String[]{
								"id", 
								"entity_id", 
								"rating", 
								"date", 
								"text", 
								"rank", 
								"info" 
							}, 
							new Object[]{
								b.get("review_id"), 
								b.get("business_id"), 
								b.get("stars"), 
								date, 
								b.get("text"), 
								((DBObject)b.get("votes")).get("useful"), 
								info
							});
					
					
					
					$.print(res);
					
					BasicDBList features = (BasicDBList)b.get("features");
					features.forEach(feature -> {
						DBObject f = (DBObject)((DBObject)feature).get("feature");
						try {
							
							sql.insert(schema+ ".feature", 
									new String[]{
										"id", 
										"id_review", 
										"start", 
										"\"end\"", 
										"tag", 
										"word", 
										"lemma" 
									}, 
									new Object[]{
										b.get("review_id").toString() + f.get("start").toString(),
										b.get("review_id"), 
										f.get("start"), 
										f.get("end"), 
										f.get("tag"), 
										f.get("word"), 
										f.get("lemma") 
									});
							
							BasicDBList qualifiers = (BasicDBList)((DBObject)feature).get("qualifiers");
							qualifiers.forEach(qualifier -> {
								DBObject q = (DBObject)qualifier;
								try {
									
									sql.insert(schema+ ".qualifier", 
											new String[]{
												"id", 
												"id_feature", 
												"start", 
												"\"end\"", 
												"tag", 
												"word", 
												"lemma" 
											}, 
											new Object[]{
												b.get("review_id").toString() + f.get("start").toString() + q.get("start"),
												b.get("review_id").toString() + f.get("start").toString(), 
												q.get("start"), 
												q.get("end"), 
												q.get("tag"), 
												q.get("word"), 
												q.get("lemma") 
											});
								} catch (Exception e) {
									System.err.println("Error on qualifiers");
									$.print(b.get("review_id").toString() + f.get("start").toString() + q.get("start"));
									e.printStackTrace();
								}
							});
							
						} catch (Exception e) {
							System.err.println("Error on features");
							$.print(b.get("review_id").toString() + f.get("start").toString());
							e.printStackTrace();
						}
					});
					
				} catch (Exception e) {
					$.print(b.get("review_id").toString());
					e.printStackTrace();
				}
				
			});
		}

	public void copyBusinessToNew() throws SQLException{
		//Get current business
		$db mongo = new $db("localhost",27017,"yelp_restaurants");
		DBCollection entities = mongo.coll("entities");
		
		ISQL sql = new Postgre();
		sql.connect("jdbc:postgresql://localhost/r2sense", "postgres", "r2sense");
		String schema = "yelp_restaurants";
		
		entities.find().forEach(b -> {
			int res;
			try {
				
				PGobject info = new PGobject();
				info.setType("jsonb");
				info.setValue(b.toString());
				
				res = sql.insert(schema+ ".entity", 
						new String[]{"id", "name", "rating", "info" }, 
						new Object[]{b.get("business_id") , b.get("name"), b.get("stars"), info} );
				$.print(res);
			} catch (Exception e) {
				e.printStackTrace();
			}
			
		});
	}
}
