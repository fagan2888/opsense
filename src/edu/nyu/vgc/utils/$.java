package edu.nyu.vgc.utils;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonParser;
import com.google.gson.JsonSerializer;
import java.io.BufferedReader;
import java.io.Reader;
import java.util.Collection;
import java.util.List;
import java.util.Map;


/**
 *
 * @author Cristian
 */
public class $ {
    public static void print(Object obj){
        System.out.println(obj);
    }
    
    public static void print(Object obj, int i){
        System.out.println(obj);
        for(int j =0; j < 1 ; j++)
        {
            printLine();
        }
    }
    
    public static void print(Reader obj){
        print(readerToString(obj));
    }
    
    public static void printCol(Collection obj){
        obj.stream().forEach(d -> $.print(d.toString()));
    }
    
    public static void printMap(Map obj){
        obj.keySet().stream().forEachOrdered(o -> {
            Object value = obj.get(o);
            print(o.toString() + "->" + value.toString());
        });
    }
    
    public static void printMap(Map obj, String separator){
        obj.keySet().stream().forEachOrdered(o -> {
            Object value = obj.get(o);
            print(o.toString() + separator + value.toString());
        });
    }
    
    public static void printDelimited(String delimiter, Object... objs){
        String result = "";
        for(Object o: objs){
            result += o.toString() + ";";
        }
        result = result.substring(0,result.length()-1);
        $.print(result);
    }
    
    
   
    
    public static void printLine(){
        System.out.println("---------------------------------------------");
    }
    
    public static void printJson(String s){
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        JsonParser jp = new JsonParser();
        JsonElement je = jp.parse(s);
        String prettyJsonString = gson.toJson(je);
        print(prettyJsonString);
    }
    
     public static void printJson(Object s){
         printJson(s.toString());
     }
     
     public static void printJson(JsonSerializer s){
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        String prettyJsonString = gson.toJson(s);
        print(prettyJsonString);
     }
     
     public static void printJson(List<JsonSerializer> s){
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        String prettyJsonString = gson.toJson(s);
        print(prettyJsonString);
     }
     
     public static void printJson(Reader s){
         printJson(readerToString(s));
     }
     
     
     
     
     public static String readerToString(Reader reader){
         String result = "";
         try{
             try (BufferedReader rd = new BufferedReader(reader)) {
                 String line;
                 
                 while ((line = rd.readLine()) != null) {
                    result +=  line;
                 }
                 rd.close();
                 reader.close();
             }
                 
         } catch(Exception ex) {
             
         }
         return result;
     }
}
     
     
        
        
