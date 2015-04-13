package edu.nyu.vgc.opsense.elasticsearch;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.PrintWriter;

import org.apache.commons.lang3.time.StopWatch;

import com.google.gson.JsonObject;
import com.mongodb.DB;
import com.mongodb.DBObject;

public class MongoDbToFile {
	public static void main(String[] args) throws ClassNotFoundException, InstantiationException, IllegalAccessException{
		MongoDbToFile export = new MongoDbToFile();
		export.exporterName = "YelpRestaurant";
		Class<?> clazz = Class.forName("edu.nyu.vgc.opsense.elasticsearch." + export.exporterName + "Exporter");
		export.e = (MongoExporter)clazz.newInstance();
		export.go();
	}
	
	public MongoExporter e; 
	public MongoUtil mongo = new MongoUtil();
	public String exporterName;
	private StopWatch timer = new StopWatch();
	private DB db;
	
	private int count = 0;
	public int count() {return count;}
	public void count(int count) {this.count = count;}
	
	public int total = 0;
	public boolean testMode = false;
	
	public void go(){
		System.out.println("Starting");
		db = mongo.getDB(e.dataset);
		timer.start();
		db.getCollection(e.entities)
			.find(e.getEntityFilter())
			.skip(e.entitySkip())
			.limit(e.entityLimit())
			.forEach(entity -> processEntity(entity));
		timer.stop();
	}
	public void processEntity(DBObject entity){
		System.out.println("Processing new entity");
		DBObject docFilter = e.documentFilter();
		docFilter.put(e.docEntityId(), entity.get(e.entityId()));
		entity.put("docCount", db.getCollection(e.documents).find(docFilter).count());
		db.getCollection(e.documents)
			.find(docFilter)
			.skip(e.documentSkip())
			.limit(e.documentLimit())
			.forEach(document -> {
				DBObject author = null;
				
				if(e.authors != null)
				{
					DBObject authorFilter = e.authorFilter();
					authorFilter.put(e.authorId(), document.get(e.docAuthorId()));
					author = db.getCollection(e.authors)
						.findOne(authorFilter);
				}
				JsonObject jsonDocument = e.processDocument(entity,author,document);
				count(count+1);
				Utils.printStats(count, document.get(e.docId()).toString(), timer);
				writeToFile(jsonDocument);
			});
		
	}
	
	public void writeToFile(JsonObject object){
		
		if(object != null){
			if(testMode){
				Utils.printJson(object);
			} else {
				
				try(PrintWriter out = new PrintWriter(new BufferedWriter(new FileWriter(e.output, true)))) {
					out.println(object.toString());
				} catch (Exception ex){
					ex.printStackTrace();
				}
			}
		}
	}

	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
}
