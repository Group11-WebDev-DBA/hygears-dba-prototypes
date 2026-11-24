## Steps para ma try ung mga dummy php files:

I will assume na naka install na sa end niyo xampp at mysql workbench, and ung default path ng xampp niyo ay nasa C:


Make a folder in C:\xampp\htdocs\ then name it Hygears.

Put all the php files and the hygears.sql inside Hygears.

Open hygears.sql in your workbench then run it. 

Edit `config.php` with your MySQL host, user and password.

Open XAMPP Control Panel press both start buttons of Apache and MySQL.

Open your browser, go to https://localhost/Hygears/index.php. You should be able to see "Dashboard | Roles / Purposes / Categories | People | Attendance | Items & Stock | Requests
Dashboard" where you can press the nav above to test out the schema if you like.

If you see:
## Unknown database 'hygears_db'	
   Di mo na run hygears.sql so di pa created ung database sa device mo.

## Access denied for user 'root'
	Your root account has a password. Put it in config.php as DB_PASS
## Connection refused	
   MySQL isn't started in the XAMPP panel

## MySQL won't start in XAMPP
	Another MySQL is already using port 3306 (workbench if nauna mo ininstall bago xampp). Stop that service in Windows, or change XAMPP's MySQL port and set the same port in config.php. Sa end ko 3306 port ng mysql ko sa workbench kaya pinalitan ko port ng mysql ko sa xampp ng 3307, tho 3306 parin nasa config.php ko.

## You see PHP code instead of a page	
   You opened the file directly, or Apache isn't running