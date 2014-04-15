function openShutManager(oSourceObj, oTargetObj, shutAble, oOpenTip, oShutTip) {
    var sourceObj = typeof oSourceObj == "string" ? document.getElementById(oSourceObj) : oSourceObj;
    var targetObj = typeof oTargetObj == "string" ? document.getElementById(oTargetObj) : oTargetObj;
    var openTip = oOpenTip || "";
    var shutTip = oShutTip || "";
    if (targetObj.style.display != "none") {
        if (shutAble) return;
        targetObj.style.display = "none";
        if (openTip && shutTip) {
            sourceObj.innerHTML = shutTip;
        }
    } else {
        targetObj.style.display = "block";
        if (openTip && shutTip) {
            sourceObj.innerHTML = openTip;
        }
    }
}

function syncDataFromMSTR(){

}

function popdown(name, oSourceId) {
    var childTr = document.getElementById(oSourceId).getElementsByTagName("tr");
    if (childTr.length == 2) {
        document.getElementById(oSourceId).removeChild(childTr[childTr.length - 1]);
    } else {
        var tr = document.createElement("tr");
        tr.setAttribute('class', 'poptr');

        var paratd1 = document.createElement("td");
        var paratd2 = document.createElement("td");
        var paratd3 = document.createElement("td");
        var paratd4 = document.createElement("td");

        paratd1.setAttribute('class', 'p1');
        paratd2.setAttribute('class', 'p2');
        paratd3.setAttribute('class', 'p3');
        paratd4.setAttribute('class', 'p4');

        var pop = document.createElement("div");
        pop.setAttribute('class', 'popdown');
        var metadata = document.createElement("img");
        metadata.src = "/images/edm-metadata.png";
        var quickview = document.createElement("img");
        quickview.src = "/images/edm-quickview.png";
        var querybuilder = document.createElement("img");
        querybuilder.src = "/images/edm-querybuild.png";
        var tableau = document.createElement("img");
        tableau.src = "/images/edm-tableau.png";
        var download = document.createElement("img");
        download.src = "/images/edm-download.png";

        pop.appendChild(metadata);
        var metadata_link = document.createElement('a');
        metadata_link.href = '/d.svc/' + name + "s?$format=json&$top=100";
        metadata_link.target = "_blank";
        metadata_link.appendChild(document.createTextNode("\u00A0Get JSON Data (Top 100)"));
        pop.appendChild(metadata_link);
        pop.appendChild(quickview);
        var quickview_link = document.createElement('a');
        var qLink = "/d.svc/" + name + "s/$count";
        quickview_link.href = qLink;
        quickview_link.target = "_blank";
        quickview_link.appendChild(document.createTextNode("\u00A0Row Count"));
        pop.appendChild(quickview_link);
        pop.appendChild(querybuilder);
        var querybuilder_link = document.createElement('a');
        querybuilder_link.href = '/query/' + name + "s";
        querybuilder_link.appendChild(document.createTextNode("\u00A0Build Query"));
        pop.appendChild(querybuilder_link);
        //pop.appendChild(tableau);
        // var tableau_link = document.createElement('a');
        // tableau_link.href = 'javascript:syncDataFromMSTR(\"' + name + 's\");';
        // tableau_link.appendChild(document.createTextNode("\u00A0Sync Data"));
        // pop.appendChild(tableau_link);
        // pop.appendChild(download);
        // var download_link = document.createElement('a');
        // download_link.href = 'javascript:downloadcsv(\"' + name + 's\");';
        // download_link.appendChild(document.createTextNode("\u00A0Download as CSV"));
        // pop.appendChild(download_link);

        paratd1.appendChild(pop);
        tr.appendChild(paratd1);
        tr.appendChild(paratd2);
        tr.appendChild(paratd3);
        tr.appendChild(paratd4);
        document.getElementById(oSourceId).appendChild(tr);
    }
}

function parseEntityProject(entityName) {
    if (!entityName) {
        return null;
    }

    return entityName.split("_")[0];
}
function createTbody(entyval, num) {
    var para = document.createElement("tbody");
    var tbody_id = 'tbody' + num;
    para.setAttribute('id', tbody_id);
    var paratr = document.createElement("tr");

    var paratd1 = document.createElement("td");
    var paratd2 = document.createElement("td");
    var paratd3 = document.createElement("td");
    var paratd4 = document.createElement("td");

    paratd1.setAttribute('class', 'p1');
    paratd2.setAttribute('class', 'p2');
    paratd3.setAttribute('class', 'p3');
    paratd4.setAttribute('class', 'p4');

    var project = parseEntityProject(entyval);

    var node1 = document.createElement("h5");
    var name = document.createElement("h4");
    name.appendChild(document.createTextNode(entyval));
    node1.appendChild(name);
    node1.appendChild(document.createTextNode("This entity " + entyval + " comes from MSTR Project: " + project));
    var node2 = document.createElement("h5");
    node2.appendChild(document.createTextNode("2013.07.23"));
    var node3 = document.createElement("h5");
    node3.appendChild(document.createTextNode(project));
    var node4 = document.createElement("h5");
    node4.appendChild(document.createTextNode("L2"));

    para.appendChild(paratr);
    paratr.appendChild(paratd1);
    paratr.appendChild(paratd2);
    paratr.appendChild(paratd3);
    paratr.appendChild(paratd4);

    paratd1.appendChild(node1);
    paratd2.appendChild(node2);
    paratd3.appendChild(node3);
    paratd4.appendChild(node4);

    paratr.onclick = function () {
        popdown(entyval, tbody_id);
    }

    var element = document.getElementById("entitytable");
    element.appendChild(para);
}

function getObj(id) {
    var Obj = document.getElementById(id).value;
    return Obj;
}

function check() {
    document.getElementById("testinput").focus;
    return false;//false:stop submit form

} 

function clickIndexGrid(objId) {
	if(objId === 'index-edm'){
		window.location.href = '/edm';
	}else if(objId === 'index-visu'){
		window.location.href = '/visualization';
	}else if(objId === 'index-query'){
		window.location.href = '/query';
	}else{
		window.location.href = '/consume';
	}
}


function downloadcsv(entity){
    alert("Coming Soon..." + entity);
//    OData.defaultHttpClient.enableJsonpCallback = true;
//    OData.request(
//        { requestUri: "/d.svc/" + entity,
//            method: "GET"
//        },
//        //Callback
//        function (data) {
//            var json = data["results"];
//            alert(JSON.stringify(json));
//            var csv = JSON2CSV(json);
//            window.open("data:text/csv;charset=utf-8," + escape(csv))
//        }, function (err) {
//            alert(JSON.stringify(err));
//        }
//    );

    //var json = $.parseJSON($("#json").val());

}

function JSON2CSV(objArray) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;

    var str = '';
    var line = '';

    if ($("#labels").is(':checked')) {
        var head = array[0];
        if ($("#quote").is(':checked')) {
            for (var index in array[0]) {
                var value = index + "";
                line += '"' + value.replace(/"/g, '""') + '",';
            }
        } else {
            for (var index in array[0]) {
                line += index + ',';
            }
        }

        line = line.slice(0, -1);
        str += line + '\r\n';
    }

    for (var i = 0; i < array.length; i++) {
        var line = '';

        if ($("#quote").is(':checked')) {
            for (var index in array[i]) {
                var value = array[i][index] + "";
                line += '"' + value.replace(/"/g, '""') + '",';
            }
        } else {
            for (var index in array[i]) {
                line += array[i][index] + ',';
            }
        }

        line = line.slice(0, -1);
        str += line + '\r\n';
    }
    return str;

}

/**
 * Sync the metadata and also data from MSTR report
 *
 */
function syncDataFromMSTR(name) {
	//Send a post request to the http server
	$.post('/sync', {name: name});
}
