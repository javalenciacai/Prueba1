 (responseCsv, properties, path, pathByProperties, indexFunc) => {
    //todo la codificacion se encasula aqui

    //Obtiene el json de respuesta de la ejecución
    if (responseBody != "") {
        responseData = JSON.parse(responseBody);
	    
console.log(responseData);
    }
    //Obtiene el json de respuesta del archivo
    if (responseCsv != "") {
        csvResponseBody = JSON.parse(responseCsv);
    }
    /*
        pathlevel -> Obtiene la ruta que que viene desde el archivo csv. Esta indica hasta donde se debe ingresar para verificar los valores.        
        levelNameIndexByProperties -> Indica la propiedad siguiente a un indice.
        propertyList -> Obtiene el array de propiedades a las cuales se verificará su valor.
        Ej: AccountDto.Contacts[i].Cellphone.Number
            pathLevel: AccountDto.Contacts[i]
            pathlevelIndexByProperties: Cellphone
            propertyList: Number
    */
    propertyList = (properties).split(",");
    pathlevel = path;
    pathLevelIndexByProperties = pathByProperties;
    
    //Variable que indica qué función se utilizará para verificar la información.
    index = indexFunc;
    //contador
    try {     
        var csvRespondeLength = Object.keys(getValueJSON(pathlevel, csvResponseBody)).length;
    } catch (e) { console.log("Contador csvRespondeLength Null") }

    /******************************
            Funciones
    *****************************/
    //Verifica qué función se debe ejecutar para verificar la información 
    function selectFunctByIndex() {
        switch (index) {
            case 'byProperties':
                return validateByProperties();

            case 'byIndex':
                return validateByIndex();

            case 'indexByProperties':
                return validateIndexByProperties();

            case 'indexByPropertiesByIndex':
                return validateIndexByPropertiesByIndex();

	case 'byIndexWithoutName':
                return validateByIndexWithoutName();

            default:
                pm.collectionVariables.set("reporte", false);
                return "Funcion (index) no definida verifique los datos"
        }
    }

    //Función que obtiene el valor de la propiedad que recibe en el objeto que se envía
    function getValueJSON(nameKey, objRef) {
        var arrKeys = nameKey.split('.');
        var objValue = { ...objRef };
        var propName = '';
        var propArrIndex = 0;

        for (i = 0; i < arrKeys.length; i++) {
            propName = arrKeys[i];
            if (propName.indexOf('[') > -1) {
                propArrIndex = propName.match(/\[([^)]+)\]/)[1];
                propName = propName.substring(0, propName.indexOf('['));
                objValue = objValue[propName][propArrIndex];
            }
            else {
                objValue = objValue[propName];
            }
        }
        return objValue;
    }

    //Función para verificar la data en los niveles que No son arrays
    function validateByProperties() {
        console.log("validateByProperties")
        var point = '';
        for (propierty in propertyList) {
            //variables para recorrer la respuesta del request y la respuesta del csv            
            if (pathlevel != '') { point = "." }                    
            responBody = getValueJSON(pathlevel + point + propertyList[propierty], responseData);
            responCsvBody = getValueJSON(pathlevel + point + propertyList[propierty], csvResponseBody);
                        
            if(valueUndefined(responBody,responCsvBody)){return pm.collectionVariables.get("infoError")};

            if (responBody != responCsvBody) {
                report = ("la propiedad: " + propertyList[propierty] + " genero un valor : " + responBody + " pero el valor esperado era : " + responCsvBody + " indicado en el CSV");
		            pm.collectionVariables.set("reporte", false);
                return report;
            }
            else {
                pm.collectionVariables.set("reporte", true);
            }
        }
        return ("es correcta");
    }

    //Función para verificar la data en los niveles que son arrays y se deben recorrer
    function validateByIndex() {
        console.log("validateByIndex")
        var point = '';
        var i = 0;
        do {
            for (propierty in propertyList) {
                if (pathlevel != '') { point = "." }
                //variables para recorrer la respuesta del request y la respuesta del csv
                responBody = getValueJSON(pathlevel + "[" + i + "]" + point + propertyList[propierty], responseData);
                responCsvBody = getValueJSON(pathlevel + "[" + i + "]" + point + propertyList[propierty], csvResponseBody);

                if(valueUndefined(responBody,responCsvBody)){return pm.collectionVariables.get("infoError")};

                if (responBody != responCsvBody) {
                    //esta opcion esta modificada para nomina se le agrego la impresion del empleado
                    report = ("la propiedad: " + propertyList[propierty] + " genero un valor : " + responBody + " pero el valor esperado era : " + responCsvBody + " indicado en el CSV");
		            pm.collectionVariables.set("reporte", false);
                    return report;
                }
                else {
                    pm.collectionVariables.set("reporte", true);
                }
            }
            i++;
        } while (i < csvRespondeLength)
        return ("es correcta");
    }

    function validateIndexByProperties() {
        console.log("validateIndexByProperties")
        var i = 0;
        do {
            for (propierty in propertyList) {
                //variables para recorrer la respuesta del request y la respuesta del csv
                responBody = getValueJSON(pathlevel + "[" + i + "]." + pathLevelIndexByProperties + "." + propertyList[propierty], responseData);
                responCsvBody = getValueJSON(pathlevel + "[" + i + "]." + pathLevelIndexByProperties + "." + propertyList[propierty], csvResponseBody);
				
				if(valueUndefined(responBody,responCsvBody)){return pm.collectionVariables.get("infoError")};
				
                if (responBody != responCsvBody) {
                    report = ("la propiedad: " + propertyList[propierty] + " genero un valor : " + responBody + " pero el valor esperado era : " + responCsvBody + " indicado en el CSV");
		            pm.collectionVariables.set("reporte", false);
                    return report;
                }
                else {
                    pm.collectionVariables.set("reporte", true);
                }
            }
            i++;
        } while (i < csvRespondeLength)
        return ("es correcta");
    }

    function validateIndexByPropertiesByIndex() {
        console.log("validateIndexByPropertiesByIndex")
        var i = 0;
        do {
            try {
                var csvRespondeLengthTwo = Object.keys(getValueJSON(pathlevel + "[" + i + "]." + pathLevelIndexByProperties, csvResponseBody)).length;
            } catch (e) {
                console.log("Contador csvRespondeLengthTwo Null");
                pm.collectionVariables.set("reporte", false);
                return "***ERROR***La informacion no fue encontrada por favor verifique***ERROR***"
            }
            for (var j = 0; j < csvRespondeLengthTwo; j++) {
                for (propierty in propertyList) {
                    //variables para recorrer la respuesta del request y la respuesta del csv
                    responBody = getValueJSON(pathlevel + "[" + i + "]." + pathLevelIndexByProperties + "[" + j + "]." + propertyList[propierty], responseData);
                    responCsvBody = getValueJSON(pathlevel + "[" + i + "]." + pathLevelIndexByProperties + "[" + j + "]." + propertyList[propierty], csvResponseBody);
					
					if(valueUndefined(responBody,responCsvBody)){return pm.collectionVariables.get("infoError")};

                    if (responBody != responCsvBody) {
                        report = ("la propiedad: " + propertyList[propierty] + " genero un valor : " + responBody + " pero el valor esperado era : " + responCsvBody + " indicado en el CSV");
		            pm.collectionVariables.set("reporte", false);
                        return report;
                    }
                    else {
                        pm.collectionVariables.set("reporte", true);
                    }
                }
            }
            i++;
        } while (i < csvRespondeLength)
        return ("es correcta");
    }

	function validateByIndexWithoutName() {
		console.log("validateByIndexWithoutName")
	       	var point = '';
		var i = 0;
		try {
		        var csvRespondeLengthTwo = Object.keys(csvResponseBody).length;
		    } catch (e) {
		        console.log("Contador csvRespondeLengthTwo Null");
		        pm.collectionVariables.set("reporte", false);
		        return "***ERROR***La informacion no fue encontrada por favor verifique***ERROR***"
		    }
		do {
		var indexLocal = [i]
		    for (propierty in propertyList) {
		        
		        //variables para recorrer la respuesta del request y la respuesta del csv
			if (pathLevelIndexByProperties != '') { point = "." }  
		        responBody = getValueJSON(indexLocal + "." + pathLevelIndexByProperties + point +  propertyList[propierty], responseData);
		        responCsvBody = getValueJSON(indexLocal + "." + pathLevelIndexByProperties + point + propertyList[propierty], csvResponseBody);
	
				if(valueUndefined(responBody,responCsvBody)){return pm.collectionVariables.get("infoError")};
				
		        if (responBody != responCsvBody) {
		            //esta opcion esta modificada para nomina se le agrego la impresion del empleado
		            report = ("la propiedad: " + propertyList[propierty] + " genero un valor : " + responBody + " pero el valor esperado era : " + responCsvBody + " indicado en el CSV");
		            pm.collectionVariables.set("reporte", false);
		            return report;
		        }
		        else {
		            pm.collectionVariables.set("reporte", true);
		        }
		    }
		    i++;
		} while (i < csvRespondeLengthTwo)
		return ("es correcta");
	    }
		
		function valueUndefined(responBody,responCsvBody){
			 if (responBody === undefined) 
					{
					  pm.collectionVariables.set("reporte", false); 
					  pm.collectionVariables.set("infoError", "***ERROR***La informacion de responBody no fue encontrada por favor verifique***ERROR***");
					  return true 
					}
			if (responCsvBody === undefined) 
					{
					  pm.collectionVariables.set("reporte", false); 
					  pm.collectionVariables.set("infoError", "***ERROR***La informacion de responCsvBody no fue encontrada por favor verifique***ERROR***");
					  return true 
					}
					
					
		}

   return {
        selectFunctByIndex
    };

}
