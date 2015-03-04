package edu.nyu.vgc.opsense.elasticsearch;

import java.io.StringReader;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Stream;

import javax.json.Json;
import javax.json.JsonObject;
import javax.json.JsonReader;

import org.elasticsearch.client.Client;
import org.elasticsearch.client.transport.TransportClient;
import org.elasticsearch.common.transport.InetSocketTransportAddress;



public class Import {
	
	public String source;
	public String index;
	public String type;
	
	public static void main (String[] args){
		Import imp = new Import();
		imp.source = "/Users/cristian/Downloads/rateprof_processed.json";
		imp.index = "ratemyprofessor";
		imp.type = "reviews";
		imp.go();
	}
	
	public void go(){
		Client client = new TransportClient()
    		.addTransportAddress(new InetSocketTransportAddress("localhost", 9300));
		Integer[] count = new Integer[1];
		count[0] = 1;
		Path path = Paths.get(this.source); 
		try (Stream<String> lines = Files.lines(path, Charset.defaultCharset())) {
			  lines.skip(1).limit(1).forEach(line -> {
				  
			  	JsonReader jsonReader = Json.createReader(new StringReader(line));
				JsonObject object = jsonReader.readObject();
				jsonReader.close();
				
				//System.out.println(object);
				count[0]++;
				System.out.println(count[0]);
				client.prepareIndex(this.index, this.type)
					.setSource(line)
					.setId(object.get("id").toString())
					.execute()
					.actionGet();
				
			  });
		} catch (Exception ex){
			System.err.println("Line: " + count + "\n" + ex.getMessage());
		}
		System.out.println("done");
		client.close();
	}
}
























