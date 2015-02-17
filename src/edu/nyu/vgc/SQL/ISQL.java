package edu.nyu.vgc.SQL;

import java.sql.ResultSet;
import java.sql.SQLException;

public interface ISQL {
	public void	connect(String url, String user, String password) throws SQLException;
	public ResultSet query(String query) throws SQLException;
	public int insert(String table, String[] fields, Object[] values) throws SQLException;
   
}
