package edu.nyu.vgc.SQL;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;



public class Postgre implements ISQL  {
	Connection con = null;
   
	
	public void	connect(String url, String user, String password) throws SQLException {
		this.con = DriverManager.getConnection(url, user, password);
	}
	
	public ResultSet query(String query) throws SQLException{
		Statement st = null;
	    ResultSet rs = null;
	    st = con.createStatement();
	    rs = st.executeQuery(query);
	    return rs;
	}
	
	public int insert(String table, String[] fields, Object[] values) throws SQLException{
		PreparedStatement pst = null;
        String stm = "INSERT INTO " + table + "(";
        for(String f: fields){
        	stm += f+",";
        }
        stm = stm.substring(0, stm.length()-1) + ") VALUES (";
        for(int i =0; i < values.length; i++){
        	stm += "?,";
        }
        stm = stm.substring(0, stm.length()-1) + ")";
        
        pst = con.prepareStatement(stm);
        for(int i =0; i < values.length; i++){
        	Object v = values[i];
        	pst.setObject(i+1, v);
        }
        return pst.executeUpdate();
        
	}
	
}
