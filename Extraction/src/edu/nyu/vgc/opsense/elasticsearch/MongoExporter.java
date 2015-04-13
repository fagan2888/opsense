package edu.nyu.vgc.opsense.elasticsearch;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public abstract class MongoExporter {

	public String dataset;
	public String entities;
	public String authors;
	public String documents;
	public String output;
	
	
	public DBObject getEntityFilter() {
		return new BasicDBObject();
	}

	public Object getId(DBObject entity) {
		return "id";
	}

	public DBObject getDocumentFilter() {
		return new BasicDBObject();
	}

	public DBObject documentFilter() {
		return new BasicDBObject();
	}

	public int documentSkip() {
		return 0;
	}

	public int documentLimit() {
		return Integer.MAX_VALUE;
	}

	public int entitySkip() {
		return 0;
	}

	public int entityLimit() {
		return Integer.MAX_VALUE;
	}

	public abstract String docEntityId();

	public String entityId() {
		return "_id";
	}

	public DBObject authorFilter() {
		return new BasicDBObject();
	}

	public String authorId() {
		return "_id";
	}

	public abstract String docAuthorId();

	public JsonObject processDocument(DBObject entity, DBObject author, DBObject document) {
		return new JsonObject();
	}

	public JsonObject dbObjectToJson(DBObject object){
	        JsonParser jp = new JsonParser();
	        JsonElement je = jp.parse(object.toString());
	        return je.getAsJsonObject();
	}

	public String docId() {
		// TODO Auto-generated method stub
		return "_id";
	}
	
	
}
