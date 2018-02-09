To run the application, change current directory to /Application

    cd Application

and run 

	`sudo docker-compose up`

After initialization, the application is avaliable under

	`localhost:3000`

and

	`localhost:3001`

where both versions are connected to different application- and antidote servers.
To break the connection and further the synchronisation of the data centers, just run

	`docker-compose exec antidote1 tc qdisc replace dev eth0 root netem loss 100%`

This will cause 100% packets to get lost.
If you made some changes in the single applications, you can start the synchronization by running

	`docker-compose exec antidote1 tc qdisc replace dev eth0 root netem loss 0%`

If you changed the same appointment in both instances, you should get notified about a conflict after several seconds.
If you want to reset the database state, you can just run

	`sudo docker-compose down`

Hints: The synchronization of the single data centers can last some seconds, so do not wonder if the updates from DC1 do not occurre in DC2 immediately.
The same is valid for conflicts as well.

To install necessary node.js packages, run 
    npm install

