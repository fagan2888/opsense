package edu.nyu.vgc.opsense.elasticsearch;

import java.io.StringReader;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.DateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.stream.Stream;

import javax.json.Json;
import javax.json.JsonArray;
import javax.json.JsonObject;
import javax.json.JsonObjectBuilder;
import javax.json.JsonReader;
import javax.json.JsonValue;
import javax.json.JsonWriter;
import javax.json.JsonWriterFactory;
import javax.json.stream.JsonGenerator;

import org.elasticsearch.client.Client;
import org.elasticsearch.client.transport.TransportClient;
import org.elasticsearch.common.transport.InetSocketTransportAddress;

import java.text.SimpleDateFormat;


public class Import {
	
	public String source;
	public String index;
	public String type;
	
	public static void main (String[] args){
		Import imp = new Import();
		imp.source = "/Volumes/Backup/Datasets/processText/yelp_health.json";
		imp.index = "yelp_health2";
		imp.type = "documents";
		imp.go();
	}
	
	public String fixDate(String sDate){
		Date dateD = null;
		DateFormat df = new SimpleDateFormat("MM/dd/yyyy");
		DateFormat dof = new SimpleDateFormat("yyy-MM-dd");
		
		try {
			dateD = df.parse(sDate);
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		return dof.format(dateD);
	}
	
	public JsonObjectBuilder getBuilder(JsonObject jo){
		
	    JsonObjectBuilder job = Json.createObjectBuilder();

	    for (Entry<String, JsonValue> entry : jo.entrySet()) {
	        job.add(entry.getKey(), entry.getValue());
	    }

	    return job;
	}
	
	public void go(){
		@SuppressWarnings("resource")
		Client client = new TransportClient()
    		.addTransportAddress(new InetSocketTransportAddress("localhost", 9300));
		Integer[] count = new Integer[1];
		count[0] = 0;
		Path path = Paths.get(this.source); 
		
		try (Stream<String> lines = Files.lines(path, Charset.defaultCharset())) {
			  lines.skip(0).limit(1000000).forEach(line -> {
				  
			  	JsonReader jsonReader = Json.createReader(new StringReader(line));
				JsonObject object = jsonReader.readObject();
				jsonReader.close();
				
				//String date = fixDate(object.getString("date"));
				//object = getBuilder(object).add("date", date).build();
				
				count[0]++;
				
				System.out.println(count[0]);
				//printJson(object);
				
				client.prepareIndex(this.index, this.type)
					.setSource(object.toString())
					.setId(object.getJsonObject("document").get("id").toString())
					.execute()
					.actionGet();
				
			  });
		} catch (Exception ex){
			ex.printStackTrace();
			System.err.println("Line: " + count[0] + "\n" + ex.getMessage());
		}
		System.out.println("done");
		client.close();
	}
	
	public void printJson(JsonObject obj){
		 Map<String, Object> properties = new HashMap<>(1);
        properties.put(JsonGenerator.PRETTY_PRINTING, true);
        JsonWriterFactory writerFactory = Json.createWriterFactory(properties);
        JsonWriter jsonWriter = writerFactory.createWriter(System.out);
        jsonWriter.writeObject(obj);
        
	}
	
	public void printJson(JsonArray obj){
		obj.forEach(o -> printJson((JsonObject)o));
	}
}
























